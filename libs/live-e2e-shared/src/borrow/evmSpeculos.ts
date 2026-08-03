import axios from "axios";
import { JsonRpcProvider, Signature, Transaction, isError } from "ethers";
import { filter, firstValueFrom } from "rxjs";
import { getEnv } from "@shared/env";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import type { EvmSignature } from "@ledgerhq/live-signer-evm";
import type { EvmSignablePayload } from "./types";

export type SpeculosDmkTransport = Awaited<
  ReturnType<typeof DeviceManagementKitTransportSpeculos.open>
>;

function prefix0x(hex: string): string {
  return hex.startsWith("0x") ? hex : "0x" + hex;
}

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

/** Screen labels that mean "confirm & sign" on the Ethereum app review carousel. */
const CONFIRM = /sign transaction|accept and send|hold to sign/i;
/** The idle dashboard — we must not press buttons here (it opens Settings/Quit). */
const READY = /is ready/i;

/**
 * Actively approves the transaction on Speculos: waits for the review to
 * appear, presses right until the "Sign transaction" screen, then presses
 * both. This is the button-device flow (default nanoSP); set
 * `BORROW_MANUAL_APPROVE=1` to approve by hand via VNC instead.
 *
 * We drive the Speculos REST API directly (rather than the automation rule)
 * because a blind rule can walk past "Sign transaction" onto "Reject".
 */
async function approveOnDevice(apiPort: number): Promise<void> {
  if (process.env.BORROW_MANUAL_APPROVE) return;
  const base = `http://localhost:${apiPort}`;
  const screen = async (): Promise<string> => {
    const { data } = await axios.get(`${base}/events?currentscreenonly=true`);
    const events: { text: string }[] = data.events ?? [];
    return events.map(e => e.text).join(" | ");
  };
  const pressRight = (): Promise<unknown> =>
    axios.post(`${base}/button/right`, { action: "press-and-release" });
  const pressBoth = (): Promise<unknown> =>
    axios.post(`${base}/button/both`, { action: "press-and-release" });

  // Wait for the review to come up (don't press while on the dashboard).
  for (let i = 0; i < 40; i++) {
    const s = await screen().catch(() => "");
    if (s.trim() && !READY.test(s)) break;
    await sleep(300);
  }
  // Walk the review carousel to the confirm screen, then sign.
  for (let i = 0; i < 24; i++) {
    const s = await screen().catch(() => "");
    if (CONFIRM.test(s)) {
      await pressBoth();
      return;
    }
    await pressRight().catch(() => {});
    await sleep(350);
  }
  throw new Error("[borrow] could not find the 'Sign transaction' screen to approve");
}

export interface ExecutorConfig {
  rpcUrl: string;
  chainId: number;
  path: string;
  speculosApiPort: number;
}

export interface StepResult {
  signedHex: string;
  hash?: string;
}

export class EvmSpeculosExecutor {
  private readonly provider: JsonRpcProvider;
  private readonly signer: DmkSignerEth;

  constructor(
    transport: SpeculosDmkTransport,
    private readonly config: ExecutorConfig,
  ) {
    this.provider = new JsonRpcProvider(config.rpcUrl, config.chainId);
    this.signer = new DmkSignerEth(transport.dmk, transport.sessionId);
  }

  async getAddress(): Promise<string> {
    const { address } = await this.signer.getAddress(this.config.path, false);
    return address;
  }

  private async sign(unsignedHex: string): Promise<EvmSignature> {
    this.signer.setLoadConfig({
      calServiceURL: getEnv("CAL_SERVICE_URL"),
      cryptoassetsBaseURL: getEnv("DYNAMIC_CAL_BASE_URL"),
      nftExplorerBaseURL: getEnv("NFT_METADATA_SERVICE") + "/v1/ethereum",
    });
    // Subscribe first (sends the sign APDU → the device shows the review), then
    // drive the on-device approval concurrently while the signature is pending.
    const signed = firstValueFrom(
      this.signer
        .signTransaction(this.config.path, unsignedHex.slice(2), {
          externalPlugins: true,
          erc20: true,
          nft: false,
          uniswapV3: true,
        })
        .pipe(
          filter(
            (e): e is { type: "signer.evm.signed"; value: EvmSignature } =>
              e.type === "signer.evm.signed",
          ),
        ),
    );
    await approveOnDevice(this.config.speculosApiPort);
    const { value } = await signed;
    return value;
  }

  private async waitForConfirmation(
    response: Awaited<ReturnType<JsonRpcProvider["broadcastTransaction"]>>,
  ): Promise<string> {
    try {
      const receipt = await response.wait(1);
      return receipt?.hash ?? response.hash;
    } catch (error) {
      if (isError(error, "TRANSACTION_REPLACED") && error.receipt?.status === 1) {
        return error.receipt.hash;
      }
      throw error;
    }
  }

  /**
   * Builds an EIP-1559 tx from a partner `signablePayload`, signs it on
   * Speculos, and (unless `dryRun`) broadcasts it. Missing gas/nonce/fee
   * fields are filled from the RPC.
   */
  async buildSignBroadcast(payload: EvmSignablePayload, dryRun: boolean): Promise<StepResult> {
    const from = payload.from ?? (await this.getAddress());
    const to = payload.to;
    const data = payload.data ?? "0x";
    const value = payload.value ? BigInt(payload.value) : 0n;

    const nonce = payload.nonce ?? (await this.provider.getTransactionCount(from, "pending"));

    let maxFeePerGas = payload.maxFeePerGas ? BigInt(payload.maxFeePerGas) : undefined;
    let maxPriorityFeePerGas = payload.maxPriorityFeePerGas
      ? BigInt(payload.maxPriorityFeePerGas)
      : undefined;
    if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined) {
      const fee = await this.provider.getFeeData();
      maxFeePerGas ??= fee.maxFeePerGas ?? undefined;
      maxPriorityFeePerGas ??= fee.maxPriorityFeePerGas ?? undefined;
    }

    const gasLimit = payload.gasLimit
      ? BigInt(payload.gasLimit)
      : await this.provider.estimateGas({ from, to, data, value });

    const tx = Transaction.from({
      type: 2,
      chainId: this.config.chainId,
      to,
      nonce,
      data,
      value,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    const sig = await this.sign(tx.unsignedSerialized);
    tx.signature = Signature.from({
      r: prefix0x(sig.r),
      s: prefix0x(sig.s),
      v: typeof sig.v === "number" ? sig.v : Number.parseInt(sig.v, 16),
    });
    const signedHex = tx.serialized;

    if (dryRun) return { signedHex };

    const response = await this.provider.broadcastTransaction(signedHex);
    const hash = await this.waitForConfirmation(response);
    return { signedHex, hash };
  }

  /** Releases the RPC provider's sockets — call when reused inside a test worker. */
  dispose(): void {
    this.provider.destroy();
  }
}
