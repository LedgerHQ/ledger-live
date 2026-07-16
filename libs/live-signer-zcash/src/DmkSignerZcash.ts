import type {
  ZcashAppConfig,
  ZcashAddress,
  ZcashViewKey,
  ZcashTrustedInput,
  ZcashSigner,
  ZcashSignature,
  SignerTransactionLike,
  BitcoinCreateTransactionLike,
} from "./types";
import { lastValueFrom, type Observable } from "rxjs";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  SignerZcashBuilder,
  type GetAddressDAError,
  type GetFullViewingKeyDAError,
  type SignerZcash,
  type LegacyCreateTransactionArg,
  type LegacyTransaction,
  type SignTransactionDAError,
  type SignTransactionDAOutput,
} from "@ledgerhq/device-signer-kit-zcash";

type ZcashGetAddressResult = {
  publicKey: Uint8Array;
  address: string;
  chainCode: Uint8Array;
};

type ZcashGetFullViewingKeyResult = {
  mode: "ufvk" | "orchardFvk";
  fullViewingKey: string | Uint8Array;
};

export class DmkSignerZcash implements ZcashSigner {
  private readonly signer: SignerZcash;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerZcashBuilder({ dmk, sessionId }).build();
  }

  private mapError<E extends { _tag: string }>(error: E): Error {
    if ("errorCode" in error && (error as { errorCode?: unknown }).errorCode === "6985") {
      return new UserRefusedOnDevice();
    }
    return new Error(error._tag);
  }

  private mapResult<T, E extends { _tag: string }>(state: DeviceActionState<T, E, unknown>): T {
    switch (state.status) {
      case DeviceActionStatus.Completed:
        return state.output;
      case DeviceActionStatus.Error:
        throw this.mapError(state.error);
      case DeviceActionStatus.Stopped:
      case DeviceActionStatus.NotStarted:
      case DeviceActionStatus.Pending:
      default:
        throw new Error(`Unexpected device action status: ${state.status}`);
    }
  }

  /**
   * Awaits a DMK device action to completion.
   *
   * `lastValueFrom` resolves with the action's final state once the observable
   * completes (and rejects if it errors or completes without emitting), so any
   * terminal status — including `Stopped` — settles the promise instead of
   * hanging. `mapResult` then turns that final state into the output or an error.
   */
  private async resolveDeviceAction<T, E extends { _tag: string }>(
    observable: Observable<DeviceActionState<T, E, unknown>>,
  ): Promise<T> {
    return this.mapResult(await lastValueFrom(observable));
  }

  async getAppConfig(): Promise<ZcashAppConfig> {
    throw new Error("Not implemented");
  }

  async getAddress(path: string, display?: boolean): Promise<ZcashAddress> {
    const { observable } = this.signer.getAddress(path, {
      checkOnDevice: !!display,
      skipOpenApp: true,
    });

    const result = await this.resolveDeviceAction<ZcashGetAddressResult, GetAddressDAError>(
      observable,
    );

    return {
      publicKey: Buffer.from(result.publicKey).toString("hex"),
      address: result.address,
      chainCode: Buffer.from(result.chainCode).toString("hex"),
    };
  }

  private toZip32AccountPath(path: string): string {
    const normalizedPath = path.startsWith("m/") ? path.slice(2) : path;
    const segments = normalizedPath.split("/");

    if (segments.length < 3) {
      throw new Error(`Invalid Zcash derivation path: ${path}`);
    }

    const [purpose, coinType, account] = segments;
    const accountIndex = account.match(/^(\d+)'$/)?.[1];

    if (!accountIndex || coinType !== "133'" || (purpose !== "44'" && purpose !== "32'")) {
      throw new Error(`Invalid Zcash derivation path: ${path}`);
    }

    return `32'/133'/${accountIndex}'`;
  }

  async getFullViewingKey(path: string): Promise<ZcashViewKey> {
    const zip32Path = this.toZip32AccountPath(path);
    const { observable } = this.signer.getFullViewingKey(zip32Path, {
      mode: "ufvk",
      skipOpenApp: true,
    });

    const result = await this.resolveDeviceAction<
      ZcashGetFullViewingKeyResult,
      GetFullViewingKeyDAError
    >(observable);

    if (result.mode !== "ufvk" || typeof result.fullViewingKey !== "string") {
      throw new Error("Unexpected full viewing key response mode");
    }

    return {
      viewKey: result.fullViewingKey,
    };
  }

  async getTrustedInput(): Promise<ZcashTrustedInput> {
    throw new Error("Not implemented");
  }

  private toLegacyTransaction(tx: SignerTransactionLike): LegacyTransaction {
    return {
      version: tx.version,
      inputs: tx.inputs.map(input => ({
        prevout: input.prevout,
        script: input.script,
        sequence: input.sequence,
        ...(input.tree !== undefined ? { tree: input.tree } : {}),
      })),
      ...(tx.outputs !== undefined
        ? { outputs: tx.outputs.map(output => ({ amount: output.amount, script: output.script })) }
        : {}),
      ...(tx.locktime !== undefined ? { locktime: tx.locktime } : {}),
      ...(tx.timestamp !== undefined ? { timestamp: tx.timestamp } : {}),
      ...(tx.nVersionGroupId !== undefined ? { nVersionGroupId: tx.nVersionGroupId } : {}),
      ...(tx.nExpiryHeight !== undefined ? { nExpiryHeight: tx.nExpiryHeight } : {}),
      ...(tx.extraData !== undefined ? { extraData: tx.extraData } : {}),
    };
  }

  /**
   * Sign a transparent Zcash transaction via the DMK signer.
   *
   * Maps the Bitcoin signer's `CreateTransaction` (produced by the coin module's
   * `wallet.signAccountTx`) onto the DMK `LegacyCreateTransactionArg`, runs the
   * `signTransaction` device action, and returns the fully serialized signed
   * transaction. The DMK output is `0x`-prefixed (`HexaString`); the prefix is
   * stripped so the result matches what the Bitcoin broadcast path expects.
   */
  async createPaymentTransaction(arg: BitcoinCreateTransactionLike): Promise<string> {
    const legacyArg: LegacyCreateTransactionArg = {
      inputs: arg.inputs.map(([tx, outputIndex, script, sequence, blockHeight]) => [
        this.toLegacyTransaction(tx),
        outputIndex,
        script,
        sequence,
        blockHeight,
      ]),
      associatedKeysets: arg.associatedKeysets,
      outputScriptHex: arg.outputScriptHex,
      additionals: arg.additionals,
      ...(arg.changePath !== undefined ? { changePath: arg.changePath } : {}),
      ...(arg.lockTime !== undefined ? { lockTime: arg.lockTime } : {}),
      ...(arg.blockHeight !== undefined ? { blockHeight: arg.blockHeight } : {}),
      ...(arg.sigHashType !== undefined ? { sigHashType: arg.sigHashType } : {}),
      ...(arg.expiryHeight !== undefined ? { expiryHeight: arg.expiryHeight } : {}),
    };

    // `onDeviceStreaming` (declared on the arg for legacy parity) is intentionally
    // not invoked here: DMK's `signTransaction` device action exposes no per-chunk
    // progress — its `SignTransactionDAIntermediateValue` carries only
    // `requiredUserInteraction`, with no progress/index/total to report. The legacy
    // hw-app-btc path derives those numbers from raw APDU round-trips, which DMK
    // abstracts away. The on-device signing milestone is surfaced instead via the
    // signature-requested/granted callbacks below.
    const { onDeviceSignatureRequested, onDeviceSignatureGranted } = arg;

    const { observable } = this.signer.signTransaction(legacyArg, { skipOpenApp: true });

    // The device action is already running by now; surface the on-device signature
    // request to the UI (see method doc for why this can't be observed from state).
    onDeviceSignatureRequested?.();

    const signedTx = await this.resolveDeviceAction<
      SignTransactionDAOutput,
      SignTransactionDAError
    >(observable);

    onDeviceSignatureGranted?.();

    return signedTx.startsWith("0x") ? signedTx.slice(2) : signedTx;
  }

  async signMessage(_path: string, _messageHex: string): Promise<ZcashSignature> {
    throw new Error("Not implemented");
  }
}
