import type {
  ZcashAppConfig,
  ZcashAddress,
  ZcashViewKey,
  ZcashTrustedInput,
  ZcashSigner,
  ZcashSignerEvent,
} from "./types";
import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { SignerZcash, SignerZcashBuilder } from "@ledgerhq/device-signer-kit-zcash";

export class DmkSignerZcash implements ZcashSigner {
  private readonly signer: SignerZcash;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerZcashBuilder({ dmk, sessionId }).build();
  }

  private mapError<E extends { _tag: string }>(error: E): Error {
    return new Error(error._tag);
  }

  private resolveDeviceAction<T, E extends { _tag: string }>(
    observable: {
      subscribe: (observer: {
        next: (state: DeviceActionState<T, E, unknown>) => void;
        error: (err: unknown) => void;
      }) => unknown;
    },
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this.mapError(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            resolve(state.output);
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  async getAppConfig(): Promise<ZcashAppConfig> {
    throw new Error("Not implemented");
  }

  async getAddress(path: string, display?: boolean): Promise<ZcashAddress> {
    const { observable } = this.signer.getAddress(path, {
      checkOnDevice: !!display,
      skipOpenApp: true,
    });

    const result = (await this.resolveDeviceAction(observable)) as {
      publicKey: Uint8Array;
      address: string;
      chainCode: Uint8Array;
    };

    return {
      publicKey: Buffer.from(result.publicKey).toString("hex"),
      address: result.address,
      chainCode: Buffer.from(result.chainCode).toString("hex"),
    };
  }

  async getViewKey(_path: string): Promise<ZcashViewKey> {
    throw new Error("Not implemented");
  }

  async getTrustedInput(): Promise<ZcashTrustedInput> {
    throw new Error("Not implemented");
  }

  async signTransaction(_path: string, _rawTxHex: string): Promise<ZcashSignerEvent> {
    throw new Error("Not implemented");
  }

  async signMessage(_path: string, _rawTxHex: string): Promise<ZcashSignerEvent> {
    throw new Error("Not implemented");
  }
}
