import { ErrorType } from "../hooks/type.hooks";

export const isNoTrustchainError = (error: Error) =>
  error.message.includes(ErrorType.NO_TRUSTCHAIN);

export const isUnauthorizedMemberError = (error: Error) =>
  error.name === "LedgerAPI4xx" &&
  (error.message.includes("Not a member of trustchain") ||
    error.message.includes("You are not member"));
