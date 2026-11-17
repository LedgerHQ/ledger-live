import { createHash } from "node:crypto";
import { concat, defer, Observable, of } from "rxjs";
import {
  ApduResponse,
  DeviceActionStatus,
  UserInteractionRequired,
  type DeviceActionState,
  type ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import { ledger_trade } from "@ledgerhq/hw-app-exchange/generate-protocol";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import type { broadcastEvmJob } from "@ledgerhq/live-common/wallet-api/Exchange/intents/index";
import { MockDeviceManagementKit } from "../device/mock-dmk";
import { WalletCliDmkTransport } from "../device/wallet-cli-dmk-transport";
import { _setTestDmkTransport } from "../device/register-dmk-transport";
import { USDT_CONTRACT } from "./cal-fixtures";
import { MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "./constants";
import type { Route } from "./mock-server";

/** The nonce the Exchange app hands out for a legacy (10-byte) swap. */
export const EXCHANGE_NONCE = "SWAPNONCE1";
export const PAYIN_ADDRESS = "0x000000000000000000000000000000000000dEaD";
export const UNISWAP_ROUTER = "0x66a9893cc07d91d95644aedd05d03f95e1dba8af";
export const SWAP_ID = "swap-1";
/** The partner signature of every Swap API payload. */
export const PAYLOAD_SIGNATURE = "11".repeat(64);

const START_NEW_TRANSACTION = 0x03;
const LEGACY_SWAP = 0x00;
const OK = new Uint8Array([0x90, 0x00]);

/** Valid secp256k1 `r`, `s` for chain 1: the Ethereum app's answer to any transaction. */
const DEVICE_SIGNATURE = {
  r: "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
  s: `0x${"22".repeat(32)}`,
  v: 37,
};

type ActionState = DeviceActionState<unknown, unknown, unknown>;

function deviceAction<Output, Error, Intermediate>(
  ...states: ActionState[]
): ExecuteDeviceActionReturnType<Output, Error, Intermediate> {
  const observable = new Observable<DeviceActionState<Output, Error, Intermediate>>(subscriber => {
    for (const state of states)
      subscriber.next(state as DeviceActionState<Output, Error, Intermediate>);
    subscriber.complete();
  });
  return { observable, cancel: () => {} };
}

const completed = (output: unknown): ActionState => ({
  status: DeviceActionStatus.Completed,
  output,
});
const failed = (error: unknown): ActionState => ({ status: DeviceActionStatus.Error, error });
const awaitingApproval: ActionState = {
  status: DeviceActionStatus.Pending,
  intermediateValue: { requiredUserInteraction: UserInteractionRequired.SignTransaction },
};

/**
 * A Ledger with the Exchange, Ethereum and DEX plugin apps, for `_setTestDmkTransport`: opens any
 * app but `refuseToOpen`, starts Exchange transactions, and signs every Ethereum transaction and
 * typed message once the user approves, unless `refuseToSign`. `events` records what the CLI asked
 * of it, in order, session close included. `"no-device-model"` hides which model it is.
 */
export class SwapDevice extends MockDeviceManagementKit {
  readonly events: string[] = [];
  /** Unsigned transactions the Ethereum app signed, as hex. */
  readonly signedTransactions: string[] = [];
  refuseToOpen: string | undefined;
  refuseToSign = false;

  constructor(initialState?: "no-device-model") {
    super({
      initialState,
      appResults: { Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS } },
    });
  }

  /** Makes it the CLI's device; returns the undo. */
  install(): () => void {
    const previous = _setTestDmkTransport(
      new WalletCliDmkTransport(this as never, "mock-session-id"),
    );
    return () => {
      _setTestDmkTransport(previous);
    };
  }

  override executeDeviceAction<Output, Error, Intermediate, Input>(args: {
    sessionId: string;
    deviceAction: { input: Input };
  }): ExecuteDeviceActionReturnType<Output, Error, Intermediate> {
    const input = args.deviceAction.input as Record<string, unknown>;
    const application = input.application as { name: string } | undefined;
    if (application) {
      this.events.push(`open ${application.name}`);
      return this.refuseToOpen === application.name
        ? deviceAction(failed({ _tag: "RefusedByUserDAError" }))
        : deviceAction(completed({}));
    }
    if (typeof input.derivationPath !== "string") {
      return super.executeDeviceAction(args as never) as ExecuteDeviceActionReturnType<
        Output,
        Error,
        Intermediate
      >;
    }
    const isTransaction = input.transaction instanceof Uint8Array;
    this.events.push(`${isTransaction ? "sign" : "sign typed data"} ${input.derivationPath}`);
    if (this.refuseToSign) {
      return deviceAction(failed({ _tag: "EthAppCommandError", errorCode: "6985" }));
    }
    if (isTransaction) {
      this.signedTransactions.push(Buffer.from(input.transaction as Uint8Array).toString("hex"));
    }
    return deviceAction(awaitingApproval, completed(DEVICE_SIGNATURE));
  }

  getConnectedDevice(_args: { sessionId: string }) {
    return { id: "mock-device-id", name: "Ledger Nano S Plus (mock)", type: "USB" };
  }

  override sendApdu({ apdu }: { apdu: Uint8Array }): Promise<ApduResponse> {
    if (apdu[1] !== START_NEW_TRANSACTION) return super.sendApdu({ apdu });
    this.events.push("start Exchange transaction");
    const nonce = apdu[2] === LEGACY_SWAP ? Buffer.from(EXCHANGE_NONCE) : Buffer.alloc(32, 7);
    return Promise.resolve(new ApduResponse({ statusCode: OK, data: new Uint8Array(nonce) }));
  }

  override disconnect(args: unknown): Promise<void> {
    this.events.push("close session");
    return super.disconnect(args);
  }
}

type CompleteExchange = typeof completeExchange;
type CompleteExchangeInput = Parameters<CompleteExchange>[0];

/**
 * The Exchange app's confirmation for `_setTestCompleteExchange`, without live-common's 3 s wait:
 * records what the CLI sent, then hands back the transaction with fees prepared by the real bridge,
 * or fails with `failure`.
 */
export class FakeExchangeApp {
  readonly confirmations: Pick<
    CompleteExchangeInput,
    "provider" | "binaryPayload" | "signature" | "rateType"
  >[] = [];
  failure: Error | undefined;

  constructor(private readonly device: SwapDevice) {}

  readonly completeExchange: CompleteExchange = input =>
    new Observable(subscriber => {
      const { provider, binaryPayload, signature, rateType, exchange, transaction } = input;
      this.device.events.push("confirm Exchange transaction");
      this.confirmations.push({ provider, binaryPayload, signature, rateType });
      if (this.failure) {
        subscriber.next({ type: "complete-exchange-error", error: this.failure });
        subscriber.complete();
        return;
      }
      const account = getMainAccount(exchange.fromAccount, exchange.fromParentAccount);
      void (async () => {
        const bridge = await getAccountBridge(account);
        const prepared = await bridge.prepareTransaction(account, transaction);
        subscriber.next({ type: "complete-exchange-requested", estimatedFees: "0" });
        subscriber.next({ type: "complete-exchange-result", completeExchangeResult: prepared });
        subscriber.complete();
      })().catch(error => subscriber.error(error));
    });
}

/**
 * The node behind the Device Intent broadcast job, for `_setTestBroadcastEvmJob`: confirms each
 * transaction at once instead of polling every 3 s, or reports it reverted.
 */
export class FakeEvmBroadcast {
  readonly broadcasts: { signedTxHex: string; hash: string }[] = [];
  revert = false;

  readonly job: typeof broadcastEvmJob = ({ input }) =>
    concat(
      of({ type: "broadcasting" as const }),
      defer(() => {
        const hash = `0x${createHash("sha256").update(input.signedTxHex).digest("hex")}`;
        this.broadcasts.push({ signedTxHex: input.signedTxHex, hash });
        if (this.revert) {
          return of({
            type: "failed" as const,
            error: new Error(`Transaction ${hash} reverted on chain`),
          });
        }
        return of(
          { type: "broadcasted" as const, hash },
          { type: "confirmed" as const, hash, blockHeight: 20_000_001 },
        );
      }),
    );
}

const toBytes = (value: bigint) => Buffer.from(value.toString(16).padStart(2, "0"), "hex");

/** A legacy (hex) Swap API `binaryPayload` promising `amountToWallet` atomic units. */
export function swapPayload(amountToWallet: bigint): string {
  const message = ledger_trade.NewTransactionResponse.encode({
    payinAddress: PAYIN_ADDRESS,
    amountToProvider: toBytes(100_000_000_000_000_000n),
    amountToWallet: toBytes(amountToWallet),
    deviceTransactionId: EXCHANGE_NONCE,
  });
  return Buffer.from(message.finish()).toString("hex");
}

/** A DEX row of the Swap API `/quote` answer; `tokenAllowanceData` and the like go in `overrides`. */
export function dexQuoteRow(provider: string, overrides: Record<string, unknown> = {}) {
  return {
    type: "float",
    provider,
    providerType: "DEX",
    amountFrom: 0.1,
    amountTo: 250,
    exchangeRate: 2500,
    slippage: 0.5,
    networkFees: { currency: "ethereum", gasLimit: "200000" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
    key: `${provider}-key`,
    liquiditySource: "AMM",
    customFields: { quoteId: `${provider}-quote-1`, routing: "CLASSIC" },
    ...overrides,
  };
}

/** An explorer transaction that sent `count` USDT to the account, so its sync finds the token. */
function usdtDeposit(count: string) {
  const sender = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  return {
    hash: `0x${"cd".repeat(32)}`,
    transaction_type: 2,
    nonce: "0x0",
    nonce_value: 0,
    value: "0",
    gas: "60000",
    gas_price: "1",
    max_fee_per_gas: null,
    max_priority_fee_per_gas: null,
    from: sender,
    to: USDT_CONTRACT,
    transfer_events: [{ contract: USDT_CONTRACT, from: sender, to: MOCK_ETH_ADDRESS, count }],
    erc721_transfer_events: [],
    erc1155_transfer_events: [],
    approval_events: [],
    actions: [],
    confirmations: 10,
    input: null,
    gas_used: "50000",
    cumulative_gas_used: "50000",
    status: 1,
    received_at: "2024-01-01T00:00:00.000Z",
    block: { hash: `0x${"01".repeat(32)}`, height: 19_999_990, time: "2024-01-01T00:00:00.000Z" },
  };
}

const json = async (request: Request): Promise<Record<string, unknown>> =>
  (await request.json()) as Record<string, unknown>;

/**
 * The Swap API (`/quote`, the payload, the accepted and cancelled reports, Uniswap calldata) and
 * the Ethereum explorer a swap talks to, recording each request. The fields set what they answer:
 * `balance` is the account's ETH in wei, `usdt` its USDT in atomic units (`null`: never held any).
 */
export class SwapBackend {
  balance = "1000000000000000000";
  usdt: string | null = null;
  /** Rows of the `/quote` answer: quotes or provider errors. */
  quotes: unknown[] = [];
  amountToWallet = 1_234_567n;
  /** HTTP status of the payload request; anything but 200 refuses it. */
  swapStatus = 200;
  /** HTTP status of the Uniswap calldata request; anything but 200 refuses it. */
  uniswapStatus = 200;

  /** Query and `authorization` header of each `/quote` request. */
  readonly quoteRequests: { query: Record<string, string>; authorization: string | null }[] = [];
  readonly swapRequests: Record<string, unknown>[] = [];
  readonly accepted: Record<string, unknown>[] = [];
  readonly cancelled: Record<string, unknown>[] = [];
  readonly gasEstimates: Record<string, unknown>[] = [];
  readonly sentTransactions: string[] = [];
  readonly uniswapRequests: Record<string, unknown>[] = [];

  /** Must precede `ETH_SYNC_ROUTES`, whose balance and history routes answer an empty account. */
  readonly routes: Route[] = [
    {
      method: "GET",
      match: /\/v5\/quote(\?|$)/,
      response: null,
      onRequest: request => {
        this.quoteRequests.push({
          query: Object.fromEntries(new URL(request.url).searchParams),
          authorization: request.headers.get("authorization"),
        });
        return Response.json(this.quotes);
      },
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/balance$/,
      response: null,
      onRequest: () => Response.json({ balance: this.balance }),
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/txs/,
      response: null,
      onRequest: () =>
        Response.json({ data: this.usdt === null ? [] : [usdtDeposit(this.usdt)], token: null }),
    },
    {
      method: "POST",
      match: /erc20\/balances/,
      response: null,
      onRequest: async request => {
        const tokens = (await request.json()) as { contract: string }[];
        return Response.json(
          tokens.map(({ contract }) => ({ contract, balance: this.usdt ?? "0" })),
        );
      },
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/nonce$/,
      response: { address: MOCK_ETH_ADDRESS, nonce: 0 },
    },
    {
      method: "POST",
      match: /\/tx\/estimate-gas-limit/,
      response: { estimated_gas_limit: "21000" },
      onRequest: async request => {
        this.gasEstimates.push(await json(request));
      },
    },
    {
      method: "GET",
      match: /\/gastracker\/barometer/,
      response: { low: "1", medium: "2", high: "3", next_base: "1" },
    },
    {
      method: "POST",
      match: /\/tx\/send(\?|$)/,
      response: null,
      onRequest: async request => {
        const { tx } = (await json(request)) as { tx: string };
        this.sentTransactions.push(tx);
        return Response.json({ result: `0x${"ab".repeat(32)}` });
      },
    },
    // The EVM bridge looks a transaction up before broadcasting it. No hash means not sent yet;
    // a 404 would say the same after 400 ms of retries.
    {
      method: "GET",
      match: /\/tx\/0x[0-9a-f]{64}$/,
      response: { hash: "", block: null, transfer_events: [] },
    },
    {
      method: "POST",
      match: /\/v5\/swap$/,
      response: null,
      onRequest: async request => {
        this.swapRequests.push(await json(request));
        if (this.swapStatus !== 200) {
          return Response.json({}, { status: this.swapStatus });
        }
        return Response.json({
          binaryPayload: swapPayload(this.amountToWallet),
          signature: PAYLOAD_SIGNATURE,
          payinAddress: PAYIN_ADDRESS,
          swapId: SWAP_ID,
        });
      },
    },
    {
      method: "POST",
      match: /\/v5\/swap\/accepted$/,
      response: null,
      onRequest: async request => {
        this.accepted.push(await json(request));
        return new Response(null, { status: 204 });
      },
    },
    {
      method: "POST",
      match: /\/v5\/swap\/cancelled$/,
      response: null,
      onRequest: async request => {
        this.cancelled.push(await json(request));
        return new Response(null, { status: 204 });
      },
    },
    {
      method: "POST",
      match: /\/v5\/uniswap\/swap$/,
      response: null,
      onRequest: async request => {
        this.uniswapRequests.push(await json(request));
        if (this.uniswapStatus !== 200) {
          return Response.json({ message: "no route" }, { status: this.uniswapStatus });
        }
        return Response.json({
          uniswapCallDataResponse: {
            gasFee: "1",
            requestId: "uniswap-request-1",
            swap: {
              chainId: 1,
              data: "0x3593564c",
              from: MOCK_ETH_ADDRESS,
              gasLimit: "200000",
              maxFeePerGas: "1",
              maxPriorityFeePerGas: "1",
              to: UNISWAP_ROUTER,
              value: "100000000000000000",
            },
          },
        });
      },
    },
  ];

  /** Puts the answers back to their defaults and forgets the requests. */
  reset(): void {
    this.balance = "1000000000000000000";
    this.usdt = null;
    this.quotes = [];
    this.amountToWallet = 1_234_567n;
    this.swapStatus = 200;
    this.uniswapStatus = 200;
    for (const list of [
      this.quoteRequests,
      this.swapRequests,
      this.accepted,
      this.cancelled,
      this.gasEstimates,
      this.sentTransactions,
      this.uniswapRequests,
    ]) {
      list.length = 0;
    }
  }
}
