import {
  SignerHyperliquidBuilder,
  SignActionsDAError,
  SignerHyperliquid,
} from "@ledgerhq/device-signer-kit-hyperliquid";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import type { SignActionsActionItem } from "@ledgerhq/device-signer-kit-hyperliquid";

export type Action = SignActionsActionItem;
export type Signature = {
  r: string;
  s: string;
  v: number;
};
export type Signatures = Signature[];
export type DAError = SignActionsDAError;
export type SignActionsOptions = {
  /** Set when the caller already opened the Hyperliquid app on the session. */
  skipOpenApp?: boolean;
  /** Cancels the device action, or prevents it from starting when already aborted. */
  signal?: AbortSignal;
};

export class SignActionsAbortedError extends Error {
  override name = "SignActionsAbortedError";
}

/**
 * DMK-based Hyperliquid signer using DMK signer-kit
 */
export class DmkSignerHyperliquid {
  private readonly dmkSigner: SignerHyperliquid;

  /**
   * @param dmk - instance of Device Management Kit
   * @param sessionId - active session ID of the connected device
   */
  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.dmkSigner = new SignerHyperliquidBuilder({
      dmk,
      sessionId,
    }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (
      typeof error.originalError === "object" &&
      error.originalError !== null &&
      "errorCode" in error.originalError &&
      error.originalError.errorCode === "6985"
    ) {
      return new UserRefusedOnDevice();
    }
    return new Error(error._tag, { cause: error });
  }

  /**
   * signs a Hyperliquid transaction via DMK.
   * @param path - BIP32 derivation path
   * @param certificate - Partner certificate
   * @param signedMetadata - Partner signed metadata
   * @param actions - Actions to sign at once
   * @param options - Signing options, see {@link SignActionsOptions}
   */
  async signActions(
    path: string,
    certificate: Uint8Array,
    signedMetadata: Uint8Array,
    actions: Action[],
    options?: SignActionsOptions,
  ): Promise<Signatures> {
    const signal = options?.signal;
    if (signal?.aborted) {
      throw new SignActionsAbortedError();
    }

    const { observable, cancel } = this.dmkSigner.signActions({
      derivationPath: path,
      certificate,
      signedMetadata,
      actions,
      skipOpenApp: options?.skipOpenApp,
    });

    return new Promise<Signatures>((resolve, reject) => {
      let settled = false;
      let subscription: { unsubscribe(): void } | undefined;

      const finish = (outcome: () => void) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        subscription?.unsubscribe();
        outcome();
      };

      const onAbort = () => {
        cancel();
        finish(() => reject(new SignActionsAbortedError()));
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener("abort", onAbort, { once: true });

      subscription = observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Completed) {
            finish(() => resolve(state.output));
          } else if (state.status === DeviceActionStatus.Error) {
            finish(() => reject(this._mapError(state.error)));
          } else if (state.status === DeviceActionStatus.Stopped) {
            finish(() => reject(new SignActionsAbortedError()));
          }
        },
        error: (err: unknown) => {
          finish(() => reject(err));
        },
        complete: () => {
          finish(() => reject(new SignActionsAbortedError()));
        },
      });

      if (settled) {
        subscription.unsubscribe();
      }
    });
  }
}
