import type { DeviceIntentSignFailure } from "./types";

export function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function failureToError({ failureType, subError }: DeviceIntentSignFailure): Error {
  const error = new Error(subError ?? failureType);
  error.name = failureType;
  return error;
}
