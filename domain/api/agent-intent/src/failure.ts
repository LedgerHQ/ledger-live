import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { AgentIntentErrorTypeSchema } from "@domain/entity-agent-intent";
import { AgentIntentErrorBodySchema } from "./schema";
import type { AgentIntentFailure } from "./types";

export function readAgentIntentFailure(
  error: FetchBaseQueryError | SerializedError | undefined,
): AgentIntentFailure | undefined {
  if (error === undefined) return undefined;
  if (!("status" in error)) return { kind: "unknown", message: error.message };

  switch (error.status) {
    case "FETCH_ERROR":
    case "TIMEOUT_ERROR":
      return { kind: "network" };
    case "PARSING_ERROR":
      return isSuccessStatus(error.originalStatus)
        ? { kind: "unreadable-response" }
        : httpFailure(error.originalStatus, error.data);
    case "CUSTOM_ERROR":
      return customFailure(error.error, error.data);
    default:
      return httpFailure(error.status, error.data);
  }
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/** The BFF answers a malformed request with a plain-text 400; other text bodies come from a gateway. */
const PLAIN_TEXT_STATUS = 400;

function httpFailure(status: number, body: unknown): AgentIntentFailure {
  if (typeof body === "string") {
    return status === PLAIN_TEXT_STATUS && body.length > 0
      ? { kind: "http", status, message: body }
      : { kind: "http", status };
  }
  const parsed = AgentIntentErrorBodySchema.safeParse(body);
  if (!parsed.success) return { kind: "http", status };
  const type = AgentIntentErrorTypeSchema.safeParse(parsed.data.type);
  return {
    kind: "http",
    status,
    message: parsed.data.message,
    ...(type.success ? { type: type.data } : {}),
  };
}

function customFailure(message: string, data: unknown): AgentIntentFailure {
  const schemaName =
    typeof data === "object" && data !== null ? Reflect.get(data, "schemaName") : undefined;
  if (schemaName === "argSchema") return { kind: "invalid-request", issues: message };
  if (schemaName === "rawResponseSchema" || schemaName === "responseSchema") {
    return { kind: "unreadable-response" };
  }
  return { kind: "unknown", message };
}
