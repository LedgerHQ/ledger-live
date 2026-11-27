import {
  PredictionsBindingSignerMismatch,
  PredictionsOrderExpired,
  PredictionsOrderSignerMismatch,
} from "../errors";
import { checkSaleSignedBy } from "../sellPositionTypedData";
import type { PredictionsTypedData } from "../typedData";
import type { PredictionsSigningPurpose } from "./types";

export type PredictionsSigningPurposeDetails = Readonly<{
  /** The only typed data its prompt may sign, since the prompt's copy describes it. */
  primaryType: string;
  /** Names the signature in a device error that comes without a message. */
  errorLabel: string;
  mismatchError: (address: string) => Error;
  expiredError?: () => Error;
  /** Throws a `ZodError` for typed data this signer mustn't sign. */
  checkTypedData?: (typedData: PredictionsTypedData, signerAddress: string) => void;
}>;

export const SIGNING_PURPOSES = {
  binding: {
    primaryType: "ConfirmAccountOwnership",
    errorLabel: "Predictions account binding",
    mismatchError: address =>
      new PredictionsBindingSignerMismatch(`The binding isn't signed by ${address}`),
  },
  order: {
    primaryType: "PlaceOrder",
    errorLabel: "Predictions order",
    mismatchError: address =>
      new PredictionsOrderSignerMismatch(`The order isn't signed by ${address}`),
    expiredError: () => new PredictionsOrderExpired("The order expired before it was signed"),
  },
  sale: {
    primaryType: "SellPosition",
    errorLabel: "Predictions sale",
    mismatchError: address =>
      new PredictionsOrderSignerMismatch(`The sale isn't signed by ${address}`),
    expiredError: () => new PredictionsOrderExpired("The sale expired before it was signed"),
    checkTypedData: checkSaleSignedBy,
  },
} as const satisfies Record<PredictionsSigningPurpose, PredictionsSigningPurposeDetails>;
