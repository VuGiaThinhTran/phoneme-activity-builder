export type ActivityType = "WORDLE" | "WORD_SEARCH";
export type Difficulty = "EASY" | "NORMAL" | "HARD";

export interface ApiWord {
  id: string;
  english: string;
  hint?: string;
  orderIndex: number;
  phonemes: string[];
}

export interface ApiActivitySummary {
  id: string;
  name: string;
  activityType: ActivityType;
  difficulty: Difficulty;
  gridRows?: number;
  gridCols?: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivity {
  id: string;
  name: string;
  activityType: ActivityType;
  difficulty: Difficulty;
  gridRows?: number;
  gridCols?: number;
  createdAt: string;
  updatedAt: string;
  words: ApiWord[];
}

export interface ApiErrorBody {
  error: string;
  fields?: Record<string, string[]>;
}

/** Thrown by the api* helpers below so callers can show a real error message. */
export class ApiError extends Error {
  fields?: Record<string, string[]>;
  status: number;
  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await res.json();
    } catch {
      // response wasn't JSON — fall through to the generic message below
    }
    throw new ApiError(body?.error ?? `Request failed with status ${res.status}`, res.status, body?.fields);
  }
  return res.json();
}

export async function fetchActivities(): Promise<ApiActivitySummary[]> {
  const res = await fetch("/api/activities");
  const data = await handle<{ activities: ApiActivitySummary[] }>(res);
  return data.activities;
}

export async function fetchActivity(id: string): Promise<ApiActivity> {
  const res = await fetch(`/api/activities/${id}`);
  const data = await handle<{ activity: ApiActivity }>(res);
  return data.activity;
}

export async function createActivity(input: {
  name: string;
  activityType: ActivityType;
  difficulty?: Difficulty;
  gridRows?: number;
  gridCols?: number;
}): Promise<ApiActivity> {
  const res = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ activity: ApiActivity }>(res);
  return data.activity;
}

export async function updateActivity(
  id: string,
  input: Partial<{ name: string; difficulty: Difficulty; gridRows: number; gridCols: number }>
): Promise<ApiActivity> {
  const res = await fetch(`/api/activities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ activity: ApiActivity }>(res);
  return data.activity;
}

export async function deleteActivity(id: string): Promise<void> {
  const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
  await handle<{ ok: true }>(res);
}

export async function addWord(
  activityId: string,
  input: { english: string; phonemes: string[]; hint?: string }
): Promise<ApiWord> {
  const res = await fetch(`/api/activities/${activityId}/words`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ word: ApiWord }>(res);
  return data.word;
}

export async function updateWord(
  id: string,
  input: Partial<{ english: string; phonemes: string[]; hint: string | null }>
): Promise<ApiWord> {
  const res = await fetch(`/api/words/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ word: ApiWord }>(res);
  return data.word;
}

export async function deleteWord(id: string): Promise<void> {
  const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
  await handle<{ ok: true }>(res);
}
