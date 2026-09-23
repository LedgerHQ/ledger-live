import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { AddressValidationError } from "@ledgerhq/live-common/flows/send/recipient/types";
import type { SendFlowTrackedMessage } from "./tracking";

type ErrorRecord = TransactionStatus["errors"] | TransactionStatus["warnings"];

function isNamedError(value: unknown): value is Error {
  return value instanceof Error || (typeof value === "object" && value !== null && "name" in value);
}

function getMessageId(error: Error, fallbackId: string): string {
  return error.name && error.name !== "Error" ? error.name : fallbackId;
}

export function getMessageIds(
  record: ErrorRecord | undefined,
  messageType: SendFlowTrackedMessage["messageType"],
): string[] {
  return Object.entries(record ?? {})
    .filter((entry): entry is [string, Error] => isNamedError(entry[1]))
    .map(([key, error]) => getMessageId(error, `${messageType}:${key}`));
}

function getStatusMessageId(
  status: Pick<TransactionStatus, "errors" | "warnings">,
  error: Error,
): string {
  const errorEntry = Object.entries(status.errors ?? {}).find(([, value]) => value === error);
  if (errorEntry) return getMessageId(error, `error:${errorEntry[0]}`);

  const warningEntry = Object.entries(status.warnings ?? {}).find(([, value]) => value === error);
  if (warningEntry) return getMessageId(error, `warning:${warningEntry[0]}`);

  return getMessageId(error, "Error");
}

export function getSuppressedMessageIds(
  status: Pick<TransactionStatus, "errors" | "warnings">,
  primaryMessageId: string,
  additionalIds: readonly string[] = [],
): string[] {
  return [
    ...getMessageIds(status.errors, "error"),
    ...getMessageIds(status.warnings, "warning"),
    ...additionalIds,
  ]
    .filter(messageId => messageId !== primaryMessageId)
    .filter((messageId, index, all) => all.indexOf(messageId) === index);
}

export function getActiveWarningIds(
  status: Pick<TransactionStatus, "warnings">,
): readonly string[] {
  return getMessageIds(status.warnings, "warning");
}

const ADDRESS_VALIDATION_MESSAGE_IDS: Record<Exclude<AddressValidationError, null>, string> = {
  incorrect_format: "newSendFlow.errors.incorrectFormat",
  wallet_not_exist: "newSendFlow.addressNotFound",
  incompatible_asset: "newSendFlow.errors.incompatibleAsset",
  sanctioned: "sanctioned",
};

export function getAddressValidationMessageId(error: AddressValidationError): string | null {
  return error ? ADDRESS_VALIDATION_MESSAGE_IDS[error] : null;
}

export function createTrackedMessage(
  error: Error,
  messageType: SendFlowTrackedMessage["messageType"],
  status: Pick<TransactionStatus, "errors" | "warnings">,
  additionalSuppressedIds: readonly string[] = [],
): SendFlowTrackedMessage {
  const messageId = getStatusMessageId(status, error);
  return {
    messageId,
    messageType,
    suppressedErrors: getSuppressedMessageIds(status, messageId, additionalSuppressedIds),
  };
}
