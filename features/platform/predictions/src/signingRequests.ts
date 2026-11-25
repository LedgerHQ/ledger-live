import { z } from "zod";
import { SIGNING_PURPOSES } from "./signingIntent/purposes";
import type { PredictionsSigningPurpose } from "./signingIntent/types";
import type { PredictionsSignedTypedData, PredictionsTypedData } from "./typedData";

/**
 * A signature a live app waits for. The executor and the root may call more than one callback, e.g.
 * a cancel after the answer: the opener keeps the first.
 */
export type PredictionsSigningRequest<Account> = Readonly<{
  account: Account;
  purpose: PredictionsSigningPurpose;
  typedData: PredictionsTypedData;
  onSuccess: (signature: string) => void;
  onError: (error: Error) => void;
  /** The prompt closed, or was replaced, before it was signed. */
  onCancel: () => void;
}>;

/** The app's mounted signing UI: it shows one request at a time. */
export type PredictionsSigningRoot<Account> = Readonly<{
  open: (request: PredictionsSigningRequest<Account>) => void;
  /** Cancels and closes `request`, unless another one replaced it. */
  cancel: (request: PredictionsSigningRequest<Account>) => void;
}>;

export type PredictionsSigningRequests<Account> = Readonly<{
  /** Returns the unregistration, which leaves a root registered since in place. */
  register: (root: PredictionsSigningRoot<Account>) => () => void;
  /** Fails `request` right away when no root is mounted. */
  open: (request: PredictionsSigningRequest<Account>) => void;
  cancel: (request: PredictionsSigningRequest<Account>) => void;
}>;

/** Each app keeps one, so the Wallet API handlers of every live app player reach its mounted root. */
export function createSigningRequests<Account>(): PredictionsSigningRequests<Account> {
  let mountedRoot: PredictionsSigningRoot<Account> | null = null;
  return {
    register: root => {
      mountedRoot = root;
      return () => {
        if (mountedRoot === root) mountedRoot = null;
      };
    },
    open: request => {
      if (!mountedRoot) {
        request.onError(new Error("The Predictions signing prompt isn't mounted"));
        return;
      }
      mountedRoot.open(request);
    },
    cancel: request => mountedRoot?.cancel(request),
  };
}

export type PredictionsSigner<Account> = Readonly<{
  /** Settles once, with the first answer of the request it opens. */
  sign: (
    walletAccountId: string,
    typedDataFor: (account: Account) => PredictionsTypedData,
  ) => Promise<PredictionsSignedTypedData>;
  /** Cancels the request this signer opened last, not one another player opened since. */
  cancelOpened: () => void;
}>;

/** Signs for one live app player and one purpose, with what only the app knows injected. */
export function createPredictionsSigner<Account>({
  requests,
  purpose,
  findAccount,
  onSigned,
  refusal,
}: Readonly<{
  requests: PredictionsSigningRequests<Account>;
  purpose: PredictionsSigningPurpose;
  /** Throws when the account can't sign, e.g. `PredictionsAccountNotFound`. */
  findAccount: (walletAccountId: string) => Account;
  /** Runs before `sign` answers, e.g. to open the setup the live app reports to. */
  onSigned?: () => void;
  /** What `sign` rejects with when the prompt closes unsigned, e.g. `UserRefusedOnDevice`. */
  refusal: () => Error;
}>): PredictionsSigner<Account> {
  let openedRequest: PredictionsSigningRequest<Account> | null = null;
  return {
    sign: (walletAccountId, typedDataFor) => {
      const account = findAccount(walletAccountId);
      const typedData = typedDataFor(account);
      // A ZodError reaches the live app as INVALID_PARAMS.
      z.literal(SIGNING_PURPOSES[purpose].primaryType).parse(typedData.primaryType);
      return new Promise((resolve, reject) => {
        // A signature landing after a cancel, e.g. while the sheet closes, mustn't open a sheet no
        // live app will report to.
        let isSettled = false;
        const settle = (finish: () => void) => {
          if (isSettled) return;
          isSettled = true;
          finish();
        };
        const request: PredictionsSigningRequest<Account> = {
          account,
          purpose,
          typedData,
          onSuccess: signature =>
            settle(() => {
              onSigned?.();
              resolve({ typedData, signature });
            }),
          onError: error => settle(() => reject(error)),
          onCancel: () => settle(() => reject(refusal())),
        };
        openedRequest = request;
        requests.open(request);
      });
    },
    cancelOpened: () => {
      if (openedRequest !== null) requests.cancel(openedRequest);
    },
  };
}
