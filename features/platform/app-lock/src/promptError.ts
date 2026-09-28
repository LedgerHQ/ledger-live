export type BiometricsPromptFailure = "cancelled" | "failed" | "lockedOut";

const CANCELLED_CODES = new Set([
  "-128",
  "10",
  "13",
  "e_user_cancelled",
  "error_user_canceled",
  "error_negative_button",
]);

const LOCKED_OUT_CODES = new Set(["7", "9", "error_lockout", "error_lockout_permanent"]);

function readCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "";
  }

  const { code } = error as Readonly<{ code: unknown }>;

  return typeof code === "string" || typeof code === "number" ? String(code).toLowerCase() : "";
}

function readMessage(error: unknown): string {
  return error instanceof Error ? error.message.toLowerCase() : "";
}

export function classifyBiometricsPromptError(error: unknown): BiometricsPromptFailure {
  const code = readCode(error);

  if (CANCELLED_CODES.has(code)) {
    return "cancelled";
  }

  if (LOCKED_OUT_CODES.has(code)) {
    return "lockedOut";
  }

  const message = readMessage(error);

  if (/lockout|too many attempts/.test(message)) {
    return "lockedOut";
  }

  if (/cancell?ed|canceled by the user|-128/.test(message)) {
    return "cancelled";
  }

  return "failed";
}
