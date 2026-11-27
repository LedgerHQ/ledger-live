import type { PerpsActionRequest, PerpsApi, PerpsPolling } from "./perpsApi";
import { assertSubmittable, cancelRequests, closeRequests, providerOf } from "./perpsRequests";
import type { SignRequest } from "./perpsSigning";

export type PerpsFlow = "status" | "sweep" | "sign-check";

export type PerpsFlowOptions = {
  flow: PerpsFlow;
  /** Every signature must recover to this address. */
  address: string;
  /** Account enum key, e.g. "HYPERCORE_1". */
  account?: string;
  dryRun?: boolean;
  /** Reuses a Speculos already running the Hyperliquid app. */
  speculosApiPort?: number;
  nanoAppCatalogPath?: string;
  apiUrl?: string;
  /** Market of the `sign-check` order. */
  marketId?: string;
};

export type PerpsSigner = { sign(request: SignRequest): Promise<string[]> };

export type PerpsRunnerApi = Pick<
  PerpsApi,
  "getPositions" | "getOrders" | "createAction" | "submitTransaction" | "waitForAction"
>;

export const SIGN_CHECK_MARKET_ID = "hyperliquid-xyz-xyz:xyz100-usdc";
const SIGN_CHECK_AMOUNT_USD = "11";
const CLOSED_POLLING: PerpsPolling = { intervalMs: 3_000, attempts: 20 };

/** `sign-check` signs a real order, so it never submits. */
export const resolveRunOptions = (options: PerpsFlowOptions): PerpsFlowOptions =>
  options.flow === "sign-check" ? { ...options, dryRun: true } : options;

export class PerpsRunner {
  private readonly options: PerpsFlowOptions;

  constructor(
    private readonly api: PerpsRunnerApi,
    private readonly signer: PerpsSigner,
    options: PerpsFlowOptions,
    private readonly closedPolling = CLOSED_POLLING,
  ) {
    this.options = resolveRunOptions(options);
  }

  async run(request: PerpsActionRequest): Promise<void> {
    const dryRun = this.options.dryRun ?? false;
    assertSubmittable(request.action, dryRun);
    console.log(`→ ${request.action} ${JSON.stringify(request.args)}`);
    const action = await this.api.createAction(request);
    if (typeof action.signedMetadata !== "string") {
      throw new Error(`Action ${action.id} has no signed metadata`);
    }
    const signatures = await this.signer.sign({
      address: this.options.address,
      signedMetadata: action.signedMetadata,
      transactions: action.transactions,
    });
    if (dryRun) {
      console.log(`  dry-run: signed ${signatures.length} transaction(s), not submitted`);
      return;
    }
    for (const [index, tx] of action.transactions.entries()) {
      await this.api.submitTransaction(tx.id, signatures[index]);
    }
    await this.api.waitForAction(action.id);
  }

  /** Closes positions, then cancels orders, on `marketIds` or everywhere. */
  async sweep(marketIds?: readonly string[]): Promise<void> {
    const { address } = this.options;
    const positions = await this.api.getPositions(address, marketIds);
    if (positions.length === 0) console.log("No position to close");
    for (const request of closeRequests(address, positions)) {
      await this.run(request);
    }
    // Closing can leave or cancel orders, so read them afterwards.
    const orders = await this.api.getOrders(address, marketIds);
    for (const request of cancelRequests(address, orders)) {
      await this.run(request);
    }
  }

  /** Sweeps `marketIds`, then waits until they hold no position. */
  async closeMarkets(marketIds: readonly string[]): Promise<void> {
    if (marketIds.length === 0) return;
    await this.sweep(marketIds);
    if (this.options.dryRun) return;
    const { address } = this.options;
    for (let attempt = 0; attempt < this.closedPolling.attempts; attempt++) {
      if ((await this.api.getPositions(address, marketIds)).length === 0) return;
      await new Promise(resolve => setTimeout(resolve, this.closedPolling.intervalMs));
    }
    throw new Error(`Positions still open on ${marketIds.join(", ")} for ${address}`);
  }

  async signCheck(): Promise<void> {
    const marketId = this.options.marketId ?? SIGN_CHECK_MARKET_ID;
    await this.run({
      providerId: providerOf(marketId),
      address: this.options.address,
      action: "open",
      args: {
        marketId,
        side: "long",
        amount: SIGN_CHECK_AMOUNT_USD,
        leverage: 2,
        marginMode: "isolated",
      },
    });
  }
}
