import { z } from "zod";

// --- Shared primitives -----------------------------------------------------

const activityTypeSchema = z.enum(["WORDLE", "WORD_SEARCH"], {
  message: "activityType must be either 'WORDLE' or 'WORD_SEARCH'",
});

const difficultySchema = z.enum(["EASY", "NORMAL", "HARD"], {
  message: "difficulty must be one of 'EASY', 'NORMAL', or 'HARD'",
});

// A single phoneme token — deliberately just "non-empty string", since
// symbols are variable-length (1–3 Unicode characters, e.g. "n" vs "tʃ" vs
// "æɪ"). Trimmed so stray whitespace from a form field doesn't silently
// become a "phoneme".
const phonemeTokenSchema = z
  .string()
  .trim()
  .min(1, "Each phoneme must be at least one character.")
  .max(4, "A single phoneme token looks too long — check for stray spaces.");

const englishSchema = z
  .string()
  .trim()
  .min(1, "The word's spelling can't be empty.")
  .max(64, "That spelling looks unusually long (max 64 characters).");

const hintSchema = z
  .string()
  .trim()
  .max(280, "Hints are capped at 280 characters.")
  .optional()
  .or(z.literal("").transform(() => undefined));

// --- Word -------------------------------------------------------------------

export const wordInputSchema = z.object({
  english: englishSchema,
  hint: hintSchema,
  phonemes: z
    .array(phonemeTokenSchema)
    .min(1, "A word needs at least one phoneme.")
    .max(12, "That's more phonemes than any supported word should need (max 12)."),
  orderIndex: z.number().int().min(0).optional(),
});
export type WordInput = z.infer<typeof wordInputSchema>;

// Partial update — every field optional, but whatever IS provided still has
// to pass the same rules (can't PATCH english to an empty string, etc.)
//
// `hint` needs its own handling here rather than reusing wordInputSchema's:
// Prisma's update() treats an `undefined` field as "don't touch this column"
// but a `null` field as "set this column to NULL". The create-time schema
// collapses an empty hint straight to `undefined`, which is correct for
// creation (no hint from the start either way) — but for an update, a
// teacher clearing the hint field and saving needs that to become an
// explicit `null` so the existing hint actually gets removed, not silently
// left in place.
export const wordUpdateSchema = z.object({
  english: englishSchema.optional(),
  hint: z
    .string()
    .trim()
    .max(280, "Hints are capped at 280 characters.")
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  phonemes: z
    .array(phonemeTokenSchema)
    .min(1, "A word needs at least one phoneme.")
    .max(12, "That's more phonemes than any supported word should need (max 12).")
    .optional(),
  orderIndex: z.number().int().min(0).optional(),
});
export type WordUpdateInput = z.infer<typeof wordUpdateSchema>;

// --- Activity -----------------------------------------------------------------

const baseActivitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "The activity needs a name.")
    .max(120, "That name looks too long (max 120 characters)."),
  activityType: activityTypeSchema,
  difficulty: difficultySchema.optional(),
  gridRows: z.number().int().min(5, "gridRows must be at least 5.").max(20, "gridRows can't exceed 20.").optional(),
  gridCols: z.number().int().min(5, "gridCols must be at least 5.").max(20, "gridCols can't exceed 20.").optional(),
  words: z.array(wordInputSchema).optional(),
});

export const activityInputSchema = baseActivitySchema.superRefine((data, ctx) => {
  if (data.activityType === "WORD_SEARCH") {
    if (data.gridRows === undefined || data.gridCols === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Word Search activities need both gridRows and gridCols.",
        path: ["gridRows"],
      });
    }
  }
});
export type ActivityInput = z.infer<typeof baseActivitySchema>;

export const activityUpdateSchema = baseActivitySchema.partial();
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;

// --- Error formatting --------------------------------------------------------

/** Flattens a ZodError into a simple, readable { field: [messages] } shape for API responses. */
export function formatZodError(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    out[key] = out[key] ? [...out[key], issue.message] : [issue.message];
  }
  return out;
}
