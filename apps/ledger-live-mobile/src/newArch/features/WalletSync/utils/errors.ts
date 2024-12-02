import { LedgerAPI4xx } from "@ledgerhq/errors";
import { ErrorType } from "../hooks/type.hooks";

export const isNoTrustchainError = (error: Error) =>
  error.message.includes(ErrorType.NO_TRUSTCHAIN);

export const isUnauthorizedMemberError = (error: Error) =>
  error instanceof LedgerAPI4xx &&
  (error.message.includes("Not a member of trustchain") ||
    error.message.includes("You are not member"));
