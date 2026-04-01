import { lastValueFrom } from "rxjs";
import type {
  AleoSigner,
  AleoAppConfig,
  AleoAddress,
  AleoViewKey,
  AleoRootIntentSignature,
  AleoFeeIntentSignature,
} from "@ledgerhq/coin-aleo/types/signer";
import {
  DeviceActionState,
  DeviceActionStatus,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import {
  SignerAleo,
  SignerAleoBuilder,
  GetAppConfigDAError,
  GetAddressDAError,
  GetViewKeyDAError,
  SignRootIntentDAError,
  SignFeeIntentDAError,
} from "@ledgerhq/device-signer-kit-aleo";

type DAError =
  | GetAppConfigDAError
  | GetAddressDAError
  | GetViewKeyDAError
  | SignRootIntentDAError
  | SignFeeIntentDAError;

export class DmkSignerAleo implements AleoSigner {
  private readonly signer: SignerAleo;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerAleoBuilder({ dmk, sessionId }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "69f0":
        return new UserRefusedOnDevice();
      default:
        return new Error(error._tag);
    }
  }

  private _mapResult<T, E extends DAError>(actionState: DeviceActionState<T, E, unknown>): T {
    switch (actionState.status) {
      case DeviceActionStatus.Completed: {
        return actionState.output;
      }
      case DeviceActionStatus.Error: {
        throw this._mapError<E>(actionState.error);
      }
      case DeviceActionStatus.NotStarted:
      case DeviceActionStatus.Pending:
      case DeviceActionStatus.Stopped:
      default: {
        throw new Error("Unknown device action status");
      }
    }
  }

  async getAppConfig(): Promise<AleoAppConfig> {
    const { observable } = this.signer.getAppConfig();

    const result = this._mapResult(await lastValueFrom(observable));

    return {
      version: result.version,
    };
  }

  async getAddress(path: string, display?: boolean): Promise<AleoAddress> {
    const { observable } = this.signer.getAddress(path, {
      checkOnDevice: display,
      skipOpenApp: true,
    });

    const result = this._mapResult(await lastValueFrom(observable));

    return {
      address: result.address,
    };
  }

  async getViewKey(path: string): Promise<AleoViewKey> {
    const { observable } = this.signer.getViewKey(path, {
      skipOpenApp: true,
    });

    const result = this._mapResult(await lastValueFrom(observable));

    return {
      viewKey: result.viewKey,
    };
  }

  async signRootIntent(path: string, rootIntent: Buffer): Promise<AleoRootIntentSignature> {
    const { observable } = this.signer.signRootIntent(path, new Uint8Array(rootIntent), {
      skipOpenApp: true,
    });

    const result = this._mapResult(await lastValueFrom(observable));

    return {
      signature: result.tlvSignature,
    };
  }

  async signFeeIntent(feeIntent: Buffer): Promise<AleoFeeIntentSignature> {
    const { observable } = this.signer.signFeeIntent(new Uint8Array(feeIntent), {
      skipOpenApp: true,
    });

    const result = this._mapResult(await lastValueFrom(observable));

    return {
      signature: result.tlvSignature,
    };
  }
}
