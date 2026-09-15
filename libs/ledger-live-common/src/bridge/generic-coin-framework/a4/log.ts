import { log } from "@ledgerhq/logs";

export type A4LogLevel = "info" | "warn" | "error";

export type A4StatusCategory =
  | "transport"
  | "not_found"
  | "version_conflict"
  | "unprocessable"
  | "server_error"
  | "unexpected";

export function classifyA4Status(status: number | undefined): A4StatusCategory {
  if (status === undefined) return "transport";
  if (status === 404) return "not_found";
  if (status === 412) return "version_conflict";
  if (status === 422) return "unprocessable";
  if (status >= 500) return "server_error";
  return "unexpected";
}

export type A4Method = "getAccount" | "createAccount" | "addAddresses" | "listOperations";

export type A4LogFields = {
  level: A4LogLevel;
  message: string;
  decision: string;
  chain?: string;
  method?: A4Method;
  status?: number;
  a4AccountId?: string;
  error?: unknown;
};

export function logA4({ message, error, ...fields }: A4LogFields): void {
  log("a4", message, {
    ...fields,
    ...(fields.status !== undefined ? { statusCategory: classifyA4Status(fields.status) } : {}),
    ...(error !== undefined
      ? { error: error instanceof Error ? error.message : String(error) }
      : {}),
  });
}
