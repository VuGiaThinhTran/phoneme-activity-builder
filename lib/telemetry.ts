import { SpanKind, SpanStatusCode, trace, type Attributes, type Span } from "@opentelemetry/api";

/**
 * Helpers for adding our own spans (OpenTelemetry's unit of "one step of work
 * took this long") inside the request spans that Next.js already records.
 *
 * Next.js automatically gives each request one span, e.g. "POST /api/activities".
 * That tells you the request was slow, but not WHERE the time went. Wrapping
 * the meaningful steps — validation, the database call, serialising the
 * result — in child spans turns the trace into a timeline of the request.
 *
 * If tracing isn't registered (for example in a unit test), getTracer()
 * returns a no-op tracer, so these helpers still run the wrapped function and
 * simply record nothing.
 */
const tracer = trace.getTracer("phoneme-builder");

/** Run fn inside a new span. Errors are recorded on the span and re-thrown. */
export function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T> | T,
  kind: SpanKind = SpanKind.INTERNAL
): Promise<T> {
  return tracer.startActiveSpan(name, { kind, attributes }, async (span) => {
    try {
      return await fn(span);
    } catch (err) {
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      span.end();
    }
  });
}

/** Host and port of the database, read from DATABASE_URL (never the password). */
function databaseTarget(): { host: string; port: number } {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return { host: url.hostname, port: Number(url.port) || 5432 };
  } catch {
    return { host: "unknown", port: 5432 };
  }
}

/**
 * Like withSpan, but marks the span as a call OUT to PostgreSQL: kind CLIENT,
 * plus the standard db.* / server.* attributes. In the trace this is the step
 * where the request crosses from the app container to the db container.
 */
export function withDbSpan<T>(
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
  table: string,
  fn: (span: Span) => Promise<T> | T,
  extra: Attributes = {}
): Promise<T> {
  const target = databaseTarget();
  return withSpan(
    `db ${operation} ${table}`,
    {
      "db.system": "postgresql",
      "db.operation": operation,
      "db.sql.table": table,
      "server.address": target.host,
      "server.port": target.port,
      ...extra,
    },
    fn,
    SpanKind.CLIENT
  );
}
