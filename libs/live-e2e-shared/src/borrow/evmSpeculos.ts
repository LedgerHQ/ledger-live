import { JsonRpcProvider, Signature, Transaction } from "ethers";
import { filter, firstValueFrom } from "rxjs";
import { getEnv } from "@shared/env";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import type { EvmSignature } from "@ledgerhq/live-signer-evm";
import {
  acceptBlindSigningWarning,
  acceptEnableTransactionCheck,
  fetchCurrentScreenTexts,
  pressUntilTextFound,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { DeviceLabels } from "../enum/DeviceLabels";
import type { EvmSignablePayload } from "./types";

export type SpeculosDmkTransport = Awaited<
  ReturnType<typeof DeviceManagementKitTransportSpeculos.open>
>;

function prefix0x(hex: string): string {
  return hex.startsWith("0x") ? hex : "0x" + hex;
}

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

const RPC_RETRY_ATTEMPTS = 8;
const RPC_RETRY_BASE_DELAY_MS = 3_000;
const CONFIRMATION_TIMEOUT_MS = 180_000;
const CONFIRMATION_POLL_INTERVAL_MS = 3_000;

/**
 * The keyless RPC suggests a tip of ~0.0003 gwei, three orders of magnitude below what the wallet
 * itself pays, which leaves the transaction in the mempool until it is evicted. The suggestion
 * still tracks congestion, so it is floored rather than replaced.
 *
 * The cap has to stay proportional: the node reserves `gasLimit * maxFeePerGas` up front, and these
 * actions carry an ~850k gas limit, so a flat multi-gwei cap is rejected outright for insufficient
 * funds on a thinly funded test account.
 */
const MIN_PRIORITY_FEE_WEI = 100_000_000n;
const BASE_FEE_HEADROOM = 4n;

function atLeast(suggested: bigint | null, floor: bigint): bigint {
  return suggested !== null && suggested > floor ? suggested : floor;
}

/**
 * The default keyless RPC load-balances onto archive-restricted backends, which reject a plain
 * `eth_getBlockByNumber` — needed for both fee data and confirmations — with an "Archive requests
 * require a personal token" error. Landing on one is a coin toss per call, so it reads as a broken
 * driver rather than a flaky endpoint.
 */
function isRestrictedBackendError(error: unknown): boolean {
  return JSON.stringify(error ?? "").includes("Archive requests require a personal token");
}

/** Retries read-only RPC work; safe because none of these calls broadcast. */
async function withRpcRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= RPC_RETRY_ATTEMPTS || !isRestrictedBackendError(error)) throw error;
      console.log(`    rpc: restricted backend, retrying (${attempt}/${RPC_RETRY_ATTEMPTS - 1})`);
      await sleep(RPC_RETRY_BASE_DELAY_MS * attempt);
    }
  }
}

/** The idle dashboard — we must not navigate here (it opens Settings/Quit). */
const READY = /is ready/i;
const REVIEW_POLL_ATTEMPTS = 40;
const REVIEW_POLL_INTERVAL_MS = 300;

/**
 * The sign APDU is sent concurrently with the approval, so the device can still
 * be showing the dashboard when we start driving it.
 */
async function waitForDeviceReview(apiPort: number): Promise<void> {
  for (let i = 0; i < REVIEW_POLL_ATTEMPTS; i++) {
    const texts = await fetchCurrentScreenTexts(apiPort).catch(() => "");
    if (texts.trim() && !READY.test(texts)) return;
    await sleep(REVIEW_POLL_INTERVAL_MS);
  }
}

const approveOnTouchDevice = async (): Promise<void> => {
  await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
};

const approveOnButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async (confirmLabel: string): Promise<void> => {
      await pressUntilTextFound(confirmLabel);
      await getButtonsController().both();
    },
);

/**
 * Actively approves the transaction on Speculos: clears the Transaction Check
 * opt-in the Ethereum app shows before the first review, then walks the review
 * carousel to the confirm screen and signs — swipe + hold-to-sign on touch
 * devices, right + both on button devices. Set `BORROW_MANUAL_APPROVE=1` to
 * approve by hand via VNC instead.
 *
 * We drive the device ourselves (rather than the Speculos automation rule)
 * because a blind rule can walk past "Sign transaction" onto "Reject".
 */
async function approveOnDevice(apiPort: number): Promise<void> {
  if (process.env.BORROW_MANUAL_APPROVE) return;
  await acceptEnableTransactionCheck();
  // Enabling blind signing trades the outright refusal for a risk warning in front of the
  // review; no-ops on calldata the app can describe.
  await acceptBlindSigningWarning();
  await waitForDeviceReview(apiPort);
  if (isTouchDevice()) return approveOnTouchDevice();
  if (getSpeculosModel() === DeviceModelId.nanoS) {
    return approveOnButtonDevice(DeviceLabels.ACCEPT_AND_SEND);
  }
  return approveOnButtonDevice(DeviceLabels.SIGN_TRANSACTION);
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
    // Promise.all so a signer failure surfaces as a rejection here instead of an
    // unhandled one while the approval is still driving the device.
    const [{ value }] = await Promise.all([signed, approveOnDevice(this.config.speculosApiPort)]);
    return value;
  }

  /**
   * Polls the receipt rather than awaiting `response.wait`, which fetches whole blocks to watch
   * for a replacement: the default keyless RPC rejects those for minutes at a time, while it
   * serves `eth_getTransactionReceipt` throughout. The driver never replaces a transaction of
   * its own, so the replacement watch only costs availability here.
   */
  private async waitForConfirmation(
    response: Awaited<ReturnType<JsonRpcProvider["broadcastTransaction"]>>,
  ): Promise<string> {
    const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const receipt = await withRpcRetry(() => this.provider.getTransactionReceipt(response.hash));
      if (receipt?.status === 0) {
        throw new Error(`transaction ${receipt.hash} reverted on chain`);
      }
      if (receipt) return receipt.hash;
      await sleep(CONFIRMATION_POLL_INTERVAL_MS);
    }
    throw new Error(
      `transaction ${response.hash} was not confirmed within ${CONFIRMATION_TIMEOUT_MS}ms`,
    );
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

    const nonce =
      payload.nonce ??
      (await withRpcRetry(() => this.provider.getTransactionCount(from, "pending")));

    let maxFeePerGas = payload.maxFeePerGas ? BigInt(payload.maxFeePerGas) : undefined;
    let maxPriorityFeePerGas = payload.maxPriorityFeePerGas
      ? BigInt(payload.maxPriorityFeePerGas)
      : undefined;
    if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined) {
      const fee = await withRpcRetry(() => this.provider.getFeeData());
      const block = await withRpcRetry(() => this.provider.getBlock("latest"));
      maxPriorityFeePerGas ??= atLeast(fee.maxPriorityFeePerGas, MIN_PRIORITY_FEE_WEI);
      maxFeePerGas ??= (block?.baseFeePerGas ?? 0n) * BASE_FEE_HEADROOM + maxPriorityFeePerGas;
    }

    const gasLimit = payload.gasLimit
      ? BigInt(payload.gasLimit)
      : await withRpcRetry(() => this.provider.estimateGas({ from, to, data, value }));

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
