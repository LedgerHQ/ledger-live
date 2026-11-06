import type { PredictionsBindingAnswer } from "./binding";

/**
 * A binding a live app waits for. The executor and the root may call more than one callback, e.g. a
 * cancel after the answer: the opener keeps the first.
 */
export type PredictionsBindingRequest<Account> = Readonly<{
  account: Account;
  onSuccess: (answer: PredictionsBindingAnswer) => void;
  onError: (error: Error) => void;
  /** The binding closed, or was replaced, before it was signed. */
  onCancel: () => void;
}>;

/** The app's mounted binding UI: it shows one request at a time. */
export type PredictionsBindingRoot<Account> = Readonly<{
  open: (request: PredictionsBindingRequest<Account>) => void;
  /** Cancels and closes `request`, unless another one replaced it. */
  cancel: (request: PredictionsBindingRequest<Account>) => void;
}>;

export type PredictionsBindingRequests<Account> = Readonly<{
  /** Returns the unregistration, which leaves a root registered since in place. */
  register: (root: PredictionsBindingRoot<Account>) => () => void;
  /** Fails `request` right away when no root is mounted. */
  open: (request: PredictionsBindingRequest<Account>) => void;
  cancel: (request: PredictionsBindingRequest<Account>) => void;
}>;

/** Each app keeps one, so the Wallet API handlers of every live app player reach its mounted root. */
export function createBindingRequests<Account>(): PredictionsBindingRequests<Account> {
  let mountedRoot: PredictionsBindingRoot<Account> | null = null;
  return {
    register: root => {
      mountedRoot = root;
      return () => {
        if (mountedRoot === root) mountedRoot = null;
      };
    },
    open: request => {
      if (!mountedRoot) {
        request.onError(new Error("The Predictions binding isn't mounted"));
        return;
      }
      mountedRoot.open(request);
    },
    cancel: request => mountedRoot?.cancel(request),
  };
}

export type PredictionsBindingSigner = Readonly<{
  /** `binding.sign`: settles once, with the first answer of the request it opens. */
  sign: (walletAccountId: string) => Promise<PredictionsBindingAnswer>;
  /** Cancels the binding this signer opened last, not one another player opened since. */
  cancelOpened: () => void;
}>;

/** `binding.sign` for one live app player, with what only the app knows injected. */
export function createBindingSigner<Account>({
  requests,
  findAccount,
  onSigned,
  refusal,
}: Readonly<{
  requests: PredictionsBindingRequests<Account>;
  /** Throws when the account can't sign the binding, e.g. `PredictionsBindingAccountNotFound`. */
  findAccount: (walletAccountId: string) => Account;
  /** Runs before `sign` answers, e.g. to open the setup the live app reports to. */
  onSigned: () => void;
  /** What `sign` rejects with when the binding closes unsigned, e.g. `UserRefusedOnDevice`. */
  refusal: () => Error;
}>): PredictionsBindingSigner {
  let openedRequest: PredictionsBindingRequest<Account> | null = null;
  return {
    sign: walletAccountId => {
      const account = findAccount(walletAccountId);
      return new Promise((resolve, reject) => {
        // A signature landing after a cancel, e.g. while the sheet closes, mustn't open a setup no
        // live app will report.
        let isSettled = false;
        const settle = (finish: () => void) => {
          if (isSettled) return;
          isSettled = true;
          finish();
        };
        const request: PredictionsBindingRequest<Account> = {
          account,
          onSuccess: answer =>
            settle(() => {
              onSigned();
              resolve(answer);
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
