import {
  DeviceManagementKitTransportSpeculos,
  getSpeculosDeviceModel,
} from "@ledgerhq/live-dmk-speculos";
import { signActionsOnSession } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { ActionWithNonce } from "@ledgerhq/live-common/wallet-api/Perps/types";
import { DeviceLabels } from "../enum/DeviceLabels";
import { signHyperliquidMessage } from "../families/evm";
import { fetchCurrentScreenTexts } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import type { HyperliquidSignature } from "./perpsSignature";
import { signTransactions, type HyperliquidDevice, type SignRequest } from "./perpsSigning";

function asActionWithNonce(raw: Record<string, unknown>): ActionWithNonce {
  const { action, nonce } = raw as Partial<ActionWithNonce>;
  if (!action || typeof nonce !== "number") throw new Error("Malformed Hyperliquid raw payload");
  return { action, nonce };
}

function describeDeviceError(error: unknown): Error {
  // The DMK error, with its APDU code, is the `cause`.
  const deviceError = error instanceof Error && error.cause ? error.cause : error;
  const { _tag, errorCode, message, originalError } = (deviceError ?? {}) as Record<
    string,
    unknown
  >;
  const original = (originalError ?? {}) as Record<string, unknown>;
  const details = [_tag, errorCode ?? original.errorCode, message ?? original.message]
    .filter(part => part !== undefined)
    .map(String);
  return new Error(`Hyperliquid signing failed: ${details.join(" | ")}`, { cause: error });
}

type SpeculosTransport = Awaited<ReturnType<typeof DeviceManagementKitTransportSpeculos.open>>;

/** Signs Perps transactions with the Hyperliquid app on Speculos. */
export class HyperliquidSpeculosSigner implements HyperliquidDevice {
  private constructor(
    private readonly transport: SpeculosTransport,
    private readonly apiPort: number,
    private readonly derivationPath: string,
  ) {}

  static async open(apiPort: number, derivationPath: string) {
    const transport = await DeviceManagementKitTransportSpeculos.open({
      apiPort: String(apiPort),
      model: getSpeculosDeviceModel(process.env.SPECULOS_DEVICE),
    });
    return new HyperliquidSpeculosSigner(transport, apiPort, derivationPath);
  }

  async isShowingReview(): Promise<boolean> {
    return (await fetchCurrentScreenTexts(this.apiPort)).includes(DeviceLabels.REVIEW_MESSAGE);
  }

  async signActions(
    signedMetadata: string,
    rawPayloads: Record<string, unknown>[],
    signal: AbortSignal,
  ): Promise<HyperliquidSignature[]> {
    try {
      const { signatures } = await signActionsOnSession(
        {
          dmk: this.transport.dmk,
          sessionId: this.transport.sessionId,
          deviceModelId: getSpeculosModel(),
        },
        this.derivationPath,
        {
          accountId: "",
          metadataWithSignature: signedMetadata,
          actions: rawPayloads.map(asActionWithNonce),
        },
        { signal },
      );
      return signatures;
    } catch (error) {
      throw describeDeviceError(error);
    }
  }

  approveReview(): Promise<void> {
    return signHyperliquidMessage();
  }

  sign(request: SignRequest): Promise<string[]> {
    return signTransactions(this, request);
  }

  async close() {
    await this.transport.close();
  }
}
