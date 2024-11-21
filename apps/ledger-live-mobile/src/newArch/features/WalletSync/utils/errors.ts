import { ErrorType } from "../hooks/type.hooks";

export const isNoTrustchainError = (error: Error) =>
  error.message.includes(ErrorType.NO_TRUSTCHAIN);
