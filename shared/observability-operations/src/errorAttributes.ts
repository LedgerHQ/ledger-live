import { sanitizeErrorMessage } from "./errorMessage";
import type { OperationAttributes } from "./types";

const CONSTANT_CASE_CODE = /^[A-Z][A-Z0-9_]{0,39}$/;

const DEVICE_STATUS_WORD = /^[0-9a-f]{4}$/i;

const MAX_CAUSE_DEPTH = 3;

const readField = (value: unknown, key: string): unknown => {
  if (typeof value !== "object" || value === null || !(key in value)) return undefined;
  return Reflect.get(value, key);
};

const readText = (value: unknown, key: string): string | undefined => {
  const field = readField(value, key);
  return typeof field === "string" && field.trim() !== "" ? field : undefined;
};

const nameOf = (error: unknown) => readText(error, "name") ?? readText(error, "_tag");

const apduStatusOf = (error: unknown): string | undefined => {
  const statusCode = readField(error, "statusCode");
  if (typeof statusCode === "number" && Number.isInteger(statusCode) && statusCode >= 0) {
    return `0x${statusCode.toString(16)}`;
  }
  const errorCode = readText(error, "errorCode");
  return errorCode && DEVICE_STATUS_WORD.test(errorCode)
    ? `0x${errorCode.toLowerCase()}`
    : undefined;
};

const httpStatusOf = (error: unknown): number | undefined => {
  const status = readField(error, "status");
  return typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599
    ? status
    : undefined;
};

const codeOf = (error: unknown): string | undefined => {
  const code = readField(error, "code");
  return typeof code === "string" && CONSTANT_CASE_CODE.test(code) ? code : undefined;
};

const causeOf = (error: unknown): unknown =>
  readField(error, "cause") ?? readField(error, "originalError");

const withCauses = (error: unknown): unknown[] => {
  const chain = [error];
  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth++) {
    current = causeOf(current);
    if (current === undefined || chain.includes(current)) break;
    chain.push(current);
  }
  return chain;
};

export function toErrorAttributes(error: unknown): OperationAttributes {
  const chain = withCauses(error);
  const firstInChain = <T>(read: (link: unknown) => T | undefined): T | undefined =>
    chain.map(read).find(value => value !== undefined);
  const message = firstInChain(link => readText(link, "message"));

  return {
    error_name: nameOf(error) ?? typeof error,
    error_cause_name: chain.length > 1 ? nameOf(chain[1]) : undefined,
    error_message: message === undefined ? undefined : sanitizeErrorMessage(message),
    error_apdu_status: firstInChain(apduStatusOf),
    error_http_status: firstInChain(httpStatusOf),
    error_code: firstInChain(codeOf),
  };
}
