import { PredictionsBindingSignerMismatch, PredictionsOrderSignerMismatch } from "../errors";
import type { PredictionsSigningPurpose } from "./types";

type PredictionsSigningPurposeDetails = Readonly<{
  /** The only typed data its prompt may sign, since the prompt's copy describes it. */
  primaryType: string;
  /** Names the signature in a device error that comes without a message. */
  errorLabel: string;
  mismatchError: (address: string) => Error;
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
  },
} as const satisfies Record<PredictionsSigningPurpose, PredictionsSigningPurposeDetails>;
