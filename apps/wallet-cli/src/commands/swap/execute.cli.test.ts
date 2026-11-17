import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import * as swapAnalytics from "../../analytics/swap-analytics";
import { KEYCLOAK_TOKEN, makeAuthRoutes } from "../../testing/auth-routes";
import { useFreshCalCache } from "../../testing/cal-cache";
import { USDT_API_RESPONSE, USDT_CONTRACT } from "../../testing/cal-fixtures";
import { runCli } from "../../testing/cli-runner";
import { MOCK_ETH_ADDRESS, MOCK_ETH_DESCRIPTOR } from "../../testing/constants";
import { ETH_SYNC_ROUTES } from "../../testing/eth-sync-routes";
import { MockServer } from "../../testing/mock-server";
import { makeSessionDir } from "../../testing/session-fixture";
import {
  dexQuoteRow,
  FakeEvmBroadcast,
  FakeExchangeApp,
  PAYIN_ADDRESS,
  PAYLOAD_SIGNATURE,
  SWAP_ID,
  SwapBackend,
  swapPayload,
  UNISWAP_ROUTER,
} from "../../testing/swap-execute";
import { EXCHANGE_NONCE, FakeLedger } from "../../testing/fake-ledger";
import { makeSwapQuoteRoutes } from "../../testing/swap-quote-routes";
import { _setTestBroadcastEvmJob } from "./cli-swap-die-pipeline";
import { _setTestCompleteExchange } from "./cli-swap-pipeline";

const USDT = "ethereum/erc20/usd_tether__erc20_";
const SIGN = "sign 44'/60'/0'/0/0";
const RATE_FLOATING = 1;

const backend = new SwapBackend();
const server = new MockServer([
  ...makeAuthRoutes(),
  {
    method: "GET",
    match: /\/cal\/v1\/tokens/,
    response: null,
    onRequest: request => {
      const query = decodeURIComponent(request.url).toLowerCase();
      const known = query.includes(USDT) || query.includes(USDT_CONTRACT);
      return Response.json(known ? USDT_API_RESPONSE : []);
    },
  },
  ...backend.routes,
  ...ETH_SYNC_ROUTES,
  // For its partners route: `backend` answers `/quote`.
  ...makeSwapQuoteRoutes().routes,
]);
const session = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);

let device: FakeLedger;
let exchangeApp: FakeExchangeApp;
let broadcast: FakeEvmBroadcast;
let undo: (() => void)[] = [];

beforeAll(() => server.start());
afterAll(() => {
  server.stop();
  session.cleanup();
});
beforeEach(() => {
  backend.reset();
  device = new FakeLedger();
  exchangeApp = new FakeExchangeApp(device);
  broadcast = new FakeEvmBroadcast();
  _setTestCompleteExchange(exchangeApp.completeExchange);
  _setTestBroadcastEvmJob(broadcast.job);
  undo = [useFreshCalCache(), device.install()];
});
afterEach(() => {
  for (const restore of undo.toReversed()) restore();
  _setTestCompleteExchange(null);
  _setTestBroadcastEvmJob(null);
});

type SwapOptions = {
  from?: string;
  to?: string;
  amount?: string;
  provider?: string;
  toAccount?: string | null;
};

/** `swap execute` between two of the session's Ethereum account's currencies, ETH → USDT by default. */
function swap(
  {
    from = "ethereum",
    to = USDT,
    amount = "0.1",
    provider = "changelly",
    toAccount = "ethereum-1",
  }: SwapOptions = {},
  ...extra: string[]
) {
  return runCli(
    [
      "swap",
      "execute",
      "--account",
      "ethereum-1",
      ...(toAccount === null ? [] : ["--to-account", toAccount]),
      "--from",
      from,
      "--to",
      to,
      "--amount",
      amount,
      "--provider",
      provider,
      ...extra,
    ],
    { WALLET_CLI_MOCK_PORT: String(server.port), ...session.env },
  );
}

async function swapJson(options: SwapOptions = {}) {
  const run = await swap(options, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

/** Records the swap analytics events of the test's runs. */
function recordAnalytics() {
  const spies = {
    started: spyOn(swapAnalytics, "trackSwapStarted"),
    completed: spyOn(swapAnalytics, "trackSwapCompleted"),
    rejected: spyOn(swapAnalytics, "trackSwapRejected"),
    failed: spyOn(swapAnalytics, "trackSwapFailed"),
  };
  undo.push(() => {
    for (const spy of Object.values(spies)) spy.mockRestore();
  });
  return spies;
}

/**
 * The CLI reports an accepted swap to the Swap API without awaiting it: every test whose swap goes
 * through waits for that report, or it would land in the next test.
 */
async function acceptedSwaps() {
  for (let attempt = 0; attempt < 20 && backend.accepted.length === 0; attempt++) {
    await Bun.sleep(5);
  }
  return backend.accepted;
}

/** A Permit2 `PermitSingle` allowing the Uniswap router to spend 1 USDT. */
const PERMIT2_MESSAGE = {
  domain: {
    name: "Permit2",
    chainId: 1,
    verifyingContract: "0x000000000022d473030f116ddee9f6b43ac78ba3",
  },
  types: {
    EIP712Domain: [],
    PermitSingle: [
      { name: "details", type: "PermitDetails" },
      { name: "spender", type: "address" },
      { name: "sigDeadline", type: "uint256" },
    ],
    PermitDetails: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
  },
  values: {
    details: { token: USDT_CONTRACT, amount: "1000000", expiration: "1900000000", nonce: "0" },
    spender: UNISWAP_ROUTER,
    sigDeadline: "1900000000",
  },
  primaryType: "PermitSingle",
};

const USDT_TO_ETH_ON_UNISWAP: SwapOptions = {
  from: USDT,
  to: "ethereum",
  amount: "1",
  provider: "uniswap",
};

const approvalQuote = (provider: string) =>
  dexQuoteRow(provider, {
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: true },
    tokenAllowanceData: {
      isApproved: false,
      approvalTransaction: {
        calldata: `0x095ea7b3${"00".repeat(64)}`,
        from: MOCK_ETH_ADDRESS,
        gasLimit: 60000,
        gasPrice: 1,
        to: USDT_CONTRACT,
        value: "0",
      },
    },
  });

describe("swap execute through the Exchange app (CEX providers)", () => {
  it("swaps ETH for USDT in one Exchange app session, then reports the broadcast", async () => {
    const analytics = recordAnalytics();

    const { json, exitCode, stderr } = await swapJson();

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "swap execute",
      network: "ethereum",
      from: "ethereum",
      to: USDT,
      provider: "changelly_v2",
      amount: "0.1",
      transactionId: EXCHANGE_NONCE,
      payload: { swapId: SWAP_ID, payinAddress: PAYIN_ADDRESS },
      swapId: SWAP_ID,
      operationHash: `0x${"ab".repeat(32)}`,
      amountExpectedTo: "1.234567",
      amountExpectedToAtomic: "1234567",
      magnitudeAwareRate: "0.00000000001234567",
      balanceCheck: { checked: true },
    });
    expect(device.events).toEqual([
      "open Exchange",
      "start Exchange transaction",
      "confirm Exchange transaction",
      SIGN,
      "close session",
    ]);
    // The balance pre-check prices a transfer of the swapped amount to the account itself.
    expect(backend.gasEstimates[0]).toMatchObject({
      from: MOCK_ETH_ADDRESS,
      to: MOCK_ETH_ADDRESS,
      value: "0x016345785d8a0000",
    });
    expect(backend.swapRequests).toEqual([
      {
        provider: "changelly_v2",
        deviceTransactionId: EXCHANGE_NONCE,
        from: "ethereum",
        to: USDT,
        address: MOCK_ETH_ADDRESS,
        refundAddress: MOCK_ETH_ADDRESS,
        amountFrom: "0.1",
        amountFromInSmallestDenomination: "100000000000000000",
      },
    ]);
    expect(exchangeApp.confirmations).toEqual([
      {
        provider: "changelly_v2",
        binaryPayload: swapPayload(1_234_567n),
        signature: PAYLOAD_SIGNATURE,
        rateType: RATE_FLOATING,
      },
    ]);
    expect(backend.sentTransactions).toEqual([
      expect.stringContaining(PAYIN_ADDRESS.slice(2).toLowerCase()),
    ]);
    expect(await acceptedSwaps()).toEqual([
      expect.objectContaining({
        provider: "changelly_v2",
        swapId: SWAP_ID,
        sourceCurrencyId: "ethereum",
        targetCurrencyId: USDT,
        hardwareWalletType: "nanoSP",
        swapType: "float",
      }),
    ]);
    expect(backend.cancelled).toEqual([]);
    expect(analytics.started).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "changelly_v2", feeStrategy: "medium" }),
    );
    expect(analytics.completed).toHaveBeenCalledWith(
      expect.objectContaining({ fromCurrency: "ethereum", toCurrency: USDT, toAmount: "1.234567" }),
    );
  });

  it("prints each step on stderr and the result on stdout in human output", async () => {
    const { stdout, stderr, exitCode } = await swap();

    expect(exitCode, stderr).toBe(0);
    for (const step of [
      "[1/5] Device transaction id (nonce): SWAPNONCE1",
      `[2/5] Swap API returned swapId=${SWAP_ID}`,
      "[4/5] Exchange accepted fee estimate",
      `[5/5] Broadcast complete. Operation hash: 0x${"ab".repeat(32)}`,
    ]) {
      expect(stderr).toContain(step);
    }
    expect(stdout).toContain(SWAP_ID);
    expect(await acceptedSwaps()).toHaveLength(1);
  });

  it("swaps USDT from the account's token balance, with the amount expected in ETH", async () => {
    backend.usdt = "5000000";
    backend.amountToWallet = 1n;

    const { json, exitCode, stderr } = await swapJson({ from: USDT, to: "ethereum", amount: "1" });

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      from: USDT,
      to: "ethereum",
      amountExpectedTo: "0.000000000000000001",
      amountExpectedToAtomic: "1",
    });
    expect(backend.swapRequests).toEqual([
      expect.objectContaining({
        from: USDT,
        to: "ethereum",
        amountFromInSmallestDenomination: "1000000",
      }),
    ]);
    // An ERC-20 transfer of 1 USDT to the payin address, sent to the token contract.
    expect(backend.sentTransactions).toEqual([
      expect.stringMatching(new RegExp(`${USDT_CONTRACT.slice(2)}.*a9059cbb`, "i")),
    ]);
    expect(await acceptedSwaps()).toEqual([
      expect.objectContaining({ sourceCurrencyId: USDT, targetCurrencyId: "ethereum" }),
    ]);
  });

  it("closes the device session when the Swap API refuses the swap, without reporting it cancelled", async () => {
    backend.swapStatus = 401;

    const { json, exitCode } = await swapJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "SwapBackendError",
      message: "The swap provider rejected the request.",
      http_status: 401,
    });
    expect(device.events).toEqual(["open Exchange", "start Exchange transaction", "close session"]);
    expect(backend.cancelled).toEqual([]);
    expect(backend.sentTransactions).toEqual([]);
  });

  it("reports the swap cancelled when the user refuses to sign it on the device", async () => {
    const analytics = recordAnalytics();
    device.refuseToSign = true;

    const { json, exitCode } = await swapJson();

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("UserRefusedOnDevice");
    expect(device.events.slice(-2)).toEqual([SIGN, "close session"]);
    expect(backend.sentTransactions).toEqual([]);
    expect(backend.cancelled).toEqual([
      expect.objectContaining({
        provider: "changelly_v2",
        swapId: SWAP_ID,
        swapStep: "INIT",
        sourceCurrencyId: "ethereum",
        targetCurrencyId: USDT,
        hardwareWalletType: "nanoSP",
        swapType: "float",
        errorMessage: expect.stringContaining("UserRefusedOnDevice"),
      }),
    ]);
    expect(analytics.completed).not.toHaveBeenCalled();
    expect(backend.accepted).toEqual([]);
  });

  it("tracks a swap the user rejects in the Exchange app", async () => {
    const analytics = recordAnalytics();
    exchangeApp.failure = Object.assign(new Error("Condition of use not satisfied"), {
      name: "TransportStatusError",
      statusCode: 0x6985,
    });

    const { json, exitCode } = await swapJson();

    expect(exitCode).not.toBe(0);
    expect(json.error.code).toBe("rejected");
    expect(analytics.rejected).toHaveBeenCalledWith({
      flowId: expect.any(String),
      fromCurrency: "ethereum",
      toCurrency: USDT,
      device: "nanoSP",
    });
    expect(backend.cancelled).toEqual([
      expect.objectContaining({
        swapStep: "INIT",
        statusCode: "WalletCliDeviceError",
        errorMessage: expect.stringContaining("Rejected on device."),
      }),
    ]);
  });

  it("reports the step at which the Exchange app stopped the swap", async () => {
    exchangeApp.failure = new CompleteExchangeError(
      "CHECK_PAYOUT_ADDRESS",
      "WrongDeviceForAccountPayout",
      "The payout address belongs to another device",
    );

    const { json, exitCode } = await swapJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "CompleteExchangeError",
      message: "The payout address belongs to another device",
    });
    expect(backend.cancelled).toEqual([
      expect.objectContaining({
        swapId: SWAP_ID,
        swapStep: "CHECK_PAYOUT_ADDRESS",
        statusCode: "WrongDeviceForAccountPayout",
        errorMessage: "The payout address belongs to another device",
      }),
    ]);
    expect(device.events).not.toContain(SIGN);
  });

  it("stops when the user refuses to open the Exchange app", async () => {
    device.refuseToOpen = "Exchange";

    const { json, exitCode } = await swapJson();

    expect(exitCode).not.toBe(0);
    expect(json.error).toMatchObject({
      code: "rejected",
      message: "Rejected on device. App was not opened.",
    });
    expect(device.events).toEqual(["open Exchange"]);
    expect(backend.swapRequests).toEqual([]);
  });
});

describe("swap execute in the provider's embedded coin app (DEX providers)", () => {
  it("signs a Uniswap swap in the Uniswap app and broadcasts it", async () => {
    const analytics = recordAnalytics();
    backend.quotes = [dexQuoteRow("uniswap")];

    const { json, exitCode, stderr } = await swapJson({ provider: "uniswap" });

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "swap execute",
      network: "ethereum",
      plan: "direct-swap",
      from: "ethereum",
      to: USDT,
      provider: "uniswap",
      amount: "0.1",
      quoteId: "uniswap-quote-1",
      swapTxHash: broadcast.broadcasts[0]?.hash,
      balanceCheck: { checked: true },
    });
    expect(json.approvalTxHash).toBeUndefined();
    expect(backend.quoteRequests).toEqual([
      {
        query: expect.objectContaining({
          "providers-whitelist": "uniswap",
          from: "ethereum",
          to: USDT,
          amountFrom: "0.1",
          addressFrom: MOCK_ETH_ADDRESS,
          addressTo: MOCK_ETH_ADDRESS,
        }),
        authorization: `Bearer ${KEYCLOAK_TOKEN}`,
      },
    ]);
    expect(backend.uniswapRequests).toEqual([
      expect.objectContaining({ quoteId: "uniswap-quote-1", routing: "CLASSIC" }),
    ]);
    expect(device.events).toEqual(["open Ethereum", "open Uniswap", SIGN, "close session"]);
    expect(device.signedTransactions).toEqual([
      expect.stringMatching(new RegExp(`${UNISWAP_ROUTER.slice(2)}.*3593564c`, "i")),
    ]);
    expect(broadcast.broadcasts).toHaveLength(1);
    expect(exchangeApp.confirmations).toEqual([]);
    expect(analytics.completed).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "uniswap", fromAmount: "0.1", toAmount: "250" }),
    );
  });

  it("approves the token in the Ethereum app before signing the swap", async () => {
    backend.usdt = "5000000";
    backend.quotes = [approvalQuote("uniswap")];

    const { json, exitCode, stderr } = await swapJson(USDT_TO_ETH_ON_UNISWAP);

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      plan: "approval-then-swap",
      approvalTxHash: broadcast.broadcasts[0]?.hash,
      swapTxHash: broadcast.broadcasts[1]?.hash,
    });
    expect(device.events).toEqual(["open Ethereum", SIGN, "open Uniswap", SIGN, "close session"]);
    expect(device.signedTransactions[0]).toMatch(
      new RegExp(`${USDT_CONTRACT.slice(2)}.*095ea7b3`, "i"),
    );
  });

  it("signs the quote's Permit2 message and hands its signature to the swap", async () => {
    backend.usdt = "5000000";
    backend.quotes = [dexQuoteRow("uniswap", { customFields: { permitData: PERMIT2_MESSAGE } })];

    const { json, exitCode, stderr } = await swapJson(USDT_TO_ETH_ON_UNISWAP);

    expect(exitCode, stderr).toBe(0);
    expect(json.plan).toBe("permit-then-swap");
    expect(device.events).toEqual([
      "open Ethereum",
      "sign typed data 44'/60'/0'/0/0",
      "open Uniswap",
      SIGN,
      "close session",
    ]);
    expect(backend.uniswapRequests).toEqual([
      expect.objectContaining({ signature: expect.stringMatching(/^0x[0-9a-f]{130}$/) }),
    ]);
    expect(broadcast.broadcasts).toHaveLength(1);
  });

  it("fails before signing anything when the Swap API can't build the calldata", async () => {
    backend.quotes = [dexQuoteRow("uniswap")];
    backend.uniswapStatus = 400;

    const { exitCode } = await swapJson({ provider: "uniswap" });

    expect(exitCode).toBe(1);
    expect(device.events).toEqual(["open Ethereum", "close session"]);
    expect(broadcast.broadcasts).toEqual([]);
  });

  it("fails when the device doesn't tell its model", async () => {
    device = new FakeLedger({ initialState: "no-device-model" });
    undo.push(device.install());
    backend.quotes = [dexQuoteRow("uniswap")];

    const { json, exitCode } = await swapJson({ provider: "uniswap" });

    expect(exitCode).toBe(1);
    expect(json.error.message).toBe("Could not resolve the connected device model id");
  });

  it("shows its progress in human output", async () => {
    backend.quotes = [dexQuoteRow("uniswap")];

    const { stdout, stderr, exitCode } = await swap({ provider: "uniswap" });

    expect(exitCode, stderr).toBe(0);
    expect(stderr).toContain("[i] Using provider=uniswap; fetching quote…");
    expect(stderr).toContain("Switching device app: Ethereum → Uniswap");
    expect(stderr).toContain("Confirm sign-swap on device…");
    expect(stdout).toContain(broadcast.broadcasts[0].hash);
  });

  it.each([
    [
      "a 1inch quote that needs an approval it doesn't ship",
      "1inch",
      "oneinch",
      dexQuoteRow("oneinch", {
        tags: { isRegistrationRequired: false, isTokenApprovalRequired: true },
        tokenAllowanceData: { isApproved: false },
      }),
      "dex-approval-blob-missing",
    ],
    [
      "a UniswapX order",
      "uniswap",
      "uniswap",
      dexQuoteRow("uniswap", {
        customFields: {
          "@type": "UniswapDutchCustomFields",
          permitData: PERMIT2_MESSAGE,
        },
      }),
      "rfq-plan-unsupported-in-cli (rfq-order)",
    ],
  ])(
    "hands %s over to the Exchange app pipeline",
    async (_case, provider, resolved, quote, reason) => {
      backend.quotes = [quote];

      const { stderr, exitCode } = await swap({ provider });

      expect(backend.quoteRequests[0].query["providers-whitelist"]).toBe(resolved);
      expect(stderr).toContain(
        `[i] Embedded coin-app flow skipped (${reason}); falling back to legacy Exchange-app pipeline.`,
      );
      // The Exchange app only takes CEX partners: a DEX swap stops once it opened.
      expect(device.events).toEqual(["open Exchange", "close session"]);
      expect(exitCode).toBe(1);
      // The CLI framework prints the error envelope after the progress lines.
      const envelope = JSON.parse(stderr.slice(stderr.indexOf("\n{") + 1));
      expect(envelope.error.message).toBe("Unsupported provider type DEX");
    },
  );

  it.each([
    [
      [
        {
          provider: "uniswap",
          code: "rate_unavailable",
          type: "float",
          message: "rate unavailable",
          parameter: {},
        },
      ],
      "No quote from 'uniswap': uniswap: rate unavailable",
    ],
    [[], "No quote from 'uniswap': no quotes returned"],
  ])("fails without touching the device when no quote comes back (%#)", async (quotes, message) => {
    backend.quotes = quotes;

    const { json, exitCode } = await swapJson({ provider: "uniswap" });

    expect(exitCode).toBe(1);
    expect(json.error.message).toBe(message);
    expect(device.events).toEqual([]);
  });

  it("fails when the user refuses the swap on the device", async () => {
    backend.quotes = [dexQuoteRow("uniswap")];
    device.refuseToSign = true;

    const { json, exitCode } = await swapJson({ provider: "uniswap" });

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("UserRefusedOnDevice");
    expect(broadcast.broadcasts).toEqual([]);
    expect(device.events.slice(-2)).toEqual([SIGN, "close session"]);
  });

  it("tracks a swap the user rejects by not opening the Uniswap app", async () => {
    const analytics = recordAnalytics();
    backend.quotes = [dexQuoteRow("uniswap")];
    device.refuseToOpen = "Uniswap";

    const { json, exitCode } = await swapJson({ provider: "uniswap" });

    expect(exitCode).not.toBe(0);
    expect(json.error.code).toBe("rejected");
    expect(device.events).toEqual(["open Ethereum", "open Uniswap", "close session"]);
    expect(analytics.rejected).toHaveBeenCalledWith({
      flowId: expect.any(String),
      fromCurrency: "ethereum",
      toCurrency: USDT,
      device: "nanoSP",
    });
  });

  it("fails when the swap reverts on chain", async () => {
    backend.quotes = [dexQuoteRow("uniswap")];
    broadcast.revert = true;

    const { json, exitCode } = await swapJson({ provider: "uniswap" });

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/reverted on chain/);
  });
});

describe("swap execute arguments", () => {
  it.each<[string, SwapOptions, string | RegExp]>([
    [
      "an unsupported provider",
      { provider: "unknown_provider" },
      /Unsupported swap provider "unknown_provider"/,
    ],
    ["an unknown source currency", { from: "test" }, "Unknown source currency (--from): test"],
    [
      "an unknown destination currency",
      { to: "test" },
      "Unknown destination currency (--to): test",
    ],
    [
      "a source currency of another chain",
      { from: "bitcoin" },
      "--from account is ethereum but --from is bitcoin.",
    ],
    [
      "a destination currency of another chain",
      { to: "bitcoin" },
      "--to account is ethereum but --to is bitcoin.",
    ],
    [
      "a token the source account never held",
      { from: USDT, to: "ethereum" },
      `from account has no token sub-account for ${USDT}.`,
    ],
    [
      "no destination account",
      { toAccount: null },
      "Swap execute requires --to-account <descriptor-or-session-label>.",
    ],
  ])("rejects %s before any quote or device step", async (_case, options, message) => {
    const { stdout, stderr, exitCode } = await swap(options, "--output", "json");

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout || stderr).error.message).toMatch(message);
    expect(backend.quoteRequests).toEqual([]);
    expect(backend.swapRequests).toEqual([]);
    expect(device.events).toEqual([]);
  });

  it("reports an unknown currency as a failed swap", async () => {
    const analytics = recordAnalytics();

    await swap({ to: "test" });

    expect(analytics.failed).toHaveBeenCalledWith(
      expect.objectContaining({ fromCurrency: "ethereum", toCurrency: "test", errorCode: "Error" }),
    );
  });
});

describe("swap execute balance pre-check", () => {
  it.each(["changelly", "uniswap"])(
    "refuses a %s swap the account can't afford before asking for a quote",
    async provider => {
      backend.balance = "0";

      const { json, exitCode } = await swapJson({ provider, amount: "1" });

      expect(exitCode).toBe(1);
      expect(json.error.code).toBe("NotEnoughBalance");
      expect(json.error.message).toMatch(
        /^Insufficient balance: swapping 1 ETH plus [\d.]+ ETH network fees exceeds the spendable 0 ETH\.$/,
      );
      expect(backend.quoteRequests).toEqual([]);
      expect(backend.swapRequests).toEqual([]);
      expect(device.events).toEqual([]);
    },
  );

  it("leaves network fees out of a token shortfall", async () => {
    backend.usdt = "5000000";

    const { json } = await swapJson({ from: USDT, to: "ethereum", amount: "100" });

    expect(json.error.message).toBe(
      "Insufficient balance: swapping 100 USDT exceeds the spendable 5 USDT.",
    );
  });

  it("refuses a token swap when the account has no ETH for the network fees", async () => {
    backend.usdt = "5000000";
    backend.balance = "0";

    const { json } = await swapJson({ from: USDT, to: "ethereum", amount: "1" });

    expect(json.error).toMatchObject({
      code: "NotEnoughGas",
      message: expect.stringMatching(
        /^Not enough ETH to pay the [\d.]+ ETH network fees for this swap\.$/,
      ),
    });
  });
});
