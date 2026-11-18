import { PredictionsBindingSignerMismatch } from "../errors";
import type { PredictionsSigningPurpose } from "./types";

type PredictionsSigningPurposeDetails = Readonly<{
  /** The only typed data its prompt may sign, since the prompt's copy describes it. */
  primaryType: string;
  promptKeys: Readonly<{
    preparing: string;
    title: string;
    description: string;
    mismatchTitle: string;
    mismatchDescription: string;
  }>;
  /** Names the signature in a device error that comes without a message. */
  errorLabel: string;
  mismatchError: (address: string) => Error;
}>;

export const SIGNING_PURPOSES = {
  binding: {
    primaryType: "ConfirmAccountOwnership",
    promptKeys: {
      preparing: "predictions.binding.preparing",
      title: "predictions.binding.title",
      description: "predictions.binding.description",
      mismatchTitle: "predictions.binding.mismatch.title",
      mismatchDescription: "predictions.binding.mismatch.description",
    },
    errorLabel: "Predictions account binding",
    mismatchError: address =>
      new PredictionsBindingSignerMismatch(`The binding isn't signed by ${address}`),
  },
} as const satisfies Record<PredictionsSigningPurpose, PredictionsSigningPurposeDetails>;
