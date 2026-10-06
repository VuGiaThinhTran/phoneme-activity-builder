import { registerOTel } from "@vercel/otel";

/**
 * Next.js calls register() once when the server starts. This switches on
 * OpenTelemetry: from here on, Next.js itself records a span for every
 * request it handles, and the withSpan() helper in lib/telemetry.ts adds our
 * own spans inside those requests.
 *
 * Where the spans go is controlled by environment variables, not code:
 *   OTEL_EXPORTER_OTLP_ENDPOINT  e.g. http://jaeger:4318 (set in docker-compose.yml)
 *   OTEL_EXPORTER_OTLP_PROTOCOL  http/json (set in docker-compose.yml)
 * If the collector is not reachable the spans are simply dropped and requests
 * are unaffected — tracing must never be able to break a request. (Set
 * OTEL_LOG_LEVEL=debug to see what the exporter is doing.)
 */
export function register() {
  registerOTel({ serviceName: "phoneme-builder" });
}
