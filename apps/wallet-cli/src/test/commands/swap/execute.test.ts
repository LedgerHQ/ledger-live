import { ETH_SYNC_ROUTES } from "../../helpers/eth-sync-routes";
import { MockServer } from "../../helpers/mock-server";
import "../../../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type {
  GetQuotesArgs,
  GetQuotesResponse,
  Quote,
} from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import type { getAccountBridge as getLiveAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { installOutputCapture } from "../../../shared/ui";
import { CliProcessExitError } from "../../../cli-process-exit-error";
import type { AccountDescriptor } from "../../../wallet/models";
import { MOCK_ETH_DESCRIPTOR } from "../../../test/helpers/constants";
import { USDT_CONTRACT } from "../../helpers/cal-fixtures";
import { executeSwapCommand, type SwapExecuteFlags } from "../../../commands/swap/execute";

import type { FullSwapPipelineInput } from "../../../commands/swap/cli-swap-pipeline";
import type {
  CliSwapDieInput,
  CliSwapDieResult,
} from "../../../commands/swap/cli-swap-die-pipeline";

const mockPipelineResult = {
  transactionId: "mock-device-transaction-id",
  payload: {
    binaryPayload: "00",
    signature: "mock-signature",
    payinAddress: "0x0000000000000000000000000000000000000001",
    swapId: "mock-swap-id",
  },
  operationHash: "0xmockoperationhash",
  swapId: "mock-swap-id",
  amountExpectedTo: "1",
  amountExpectedToAtomic: "1000000000000000000",
  magnitudeAwareRate: "2500.5",
} as const;

const fromDescriptor: AccountDescriptor = {
  id: "js:2:ethereum:from:",
  currencyId: "ethereum",
  freshAddress: "0x000000000000000000000000000000000000000f",
  seedIdentifier: "",
  derivationMode: "",
  index: 0,
};

const toDescriptor: AccountDescriptor = {
  id: "js:2:bitcoin:to:",
  currencyId: "bitcoin",
  freshAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
  seedIdentifier: "",
  derivationMode: "",
  index: 1,
};

const ethToDescriptor: AccountDescriptor = {
  id: "js:2:ethereum:to:",
  currencyId: "ethereum",
  freshAddress: "0x000000000000000000000000000000000000000e",
  seedIdentifier: "",
  derivationMode: "",
  index: 1,
};

const USDT_TOKEN_ID = "ethereum/erc20/usd_tether__erc20_";
const usdtToken = {
  type: "TokenCurrency",
  id: USDT_TOKEN_ID,
  parentCurrencyId: "ethereum",
  contractAddress: USDT_CONTRACT,
  tokenType: "erc20",
  ticker: "USDT",
  name: "Tether USD",
  units: [
    { code: "USDT", name: "USDT", magnitude: 6 },
    { code: "uUSDT", name: "micro USDT", magnitude: 0 },
  ],
} as unknown as TokenCurrency;

const baseFlags: SwapExecuteFlags = {
  from: "ethereum",
  to: "bitcoin",
  provider: "changelly",
  amount: "0.001",
  account: MOCK_ETH_DESCRIPTOR,
  "to-account": "destination-account",
  "fee-strategy": "medium",
  output: "json",
};

const dieBaseFlags: SwapExecuteFlags = {
  ...baseFlags,
  provider: "uniswap",
};

const mockDieQuote = {
  id: "die-quote-1",
  provider: "uniswap",
} as Quote;

const mockDiePipelineResult = {
  plan: "direct-swap" as const,
  result: {
    approvalTxHash: "0xapprovalhash",
    swapTxHash: "0xswaphash",
  },
};

const getQuotesMock = mock(
  async (_args: GetQuotesArgs): Promise<GetQuotesResponse> => ({
    quotes: [mockDieQuote],
    providerErrors: [],
    warnings: [],
    errors: [],
  }),
);

function makeAccount(descriptor: AccountDescriptor): Account {
  const family =
    descriptor.currencyId === "bitcoin"
      ? "bitcoin"
      : descriptor.currencyId === "solana"
        ? "solana"
        : "evm";
  return {
    type: "Account",
    id: descriptor.id,
    freshAddress: descriptor.freshAddress,
    currency: { id: descriptor.currencyId, family },
    seedIdentifier: descriptor.seedIdentifier,
    derivationMode: descriptor.derivationMode,
    index: descriptor.index,
    freshAddressPath: "",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    swapHistory: [],
    syncHash: "",
  } as unknown as Account;
}

const resolveAccountDescriptorMock = mock(async (input: string) => {
  if (input === baseFlags.account) {
    return fromDescriptor;
  }
  if (input === "ethereum-destination-account") {
    return ethToDescriptor;
  }
  return toDescriptor;
});

const integrateNewAccountDescriptorMock = mock(async (descriptor: AccountDescriptor) => {
  return makeAccount(descriptor);
});

const getAccountBridgeMockFn = mock(() => ({}));
const getAccountBridgeMock = getAccountBridgeMockFn as unknown as typeof getLiveAccountBridge;

const runFullSwapPipelineMock = mock((_input: FullSwapPipelineInput) =>
  Promise.resolve({ ...mockPipelineResult }),
);

const runCliSwapDiePipelineMock = mock(
  async (_input: CliSwapDieInput): Promise<CliSwapDieResult> => ({
    plan: mockDiePipelineResult.plan,
    result: { ...mockDiePipelineResult.result },
  }),
);

const findTokenByIdMock = mock(async (id: string) =>
  id === USDT_TOKEN_ID ? usdtToken : undefined,
);

async function runExecuteSwapCommand(flags: SwapExecuteFlags = baseFlags) {
  const writes: string[] = [];
  const restoreCapture = installOutputCapture({
    stdout: chunk => writes.push(chunk),
  });

  try {
    await executeSwapCommand({
      flags,
      positional: [],
      resolveAccountDescriptor: resolveAccountDescriptorMock,
      integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
      getAccountBridge: getAccountBridgeMock,
      runFullSwapPipeline: runFullSwapPipelineMock,
      runCliSwapDiePipeline: runCliSwapDiePipelineMock,
      findTokenById: findTokenByIdMock,
      getQuotes: getQuotesMock,
    });
  } finally {
    restoreCapture();
  }

  return JSON.parse(writes.join("").trim());
}

describe("swap execute command", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeEach(() => {
    resolveAccountDescriptorMock.mockClear();
    integrateNewAccountDescriptorMock.mockClear();
    getAccountBridgeMockFn.mockClear();
    runFullSwapPipelineMock.mockClear();
    runCliSwapDiePipelineMock.mockClear();
    getQuotesMock.mockClear();
    getQuotesMock.mockImplementation(async () => ({
      quotes: [mockDieQuote],
      providerErrors: [],
      warnings: [],
      errors: [],
    }));
    runCliSwapDiePipelineMock.mockImplementation(async (_input: CliSwapDieInput) => ({
      plan: mockDiePipelineResult.plan,
      result: { ...mockDiePipelineResult.result },
    }));
    findTokenByIdMock.mockClear();
    server.start();
  });

  afterEach(() => {
    server.stop();
  });

  it("should emit a swap execute JSON envelope when the pipeline succeeds", async () => {
    const data = await runExecuteSwapCommand();

    expect(data.command).toBe("swap execute");
    expect(data.network).toBe("ethereum:main");
    expect(data.from).toBe("ethereum");
    expect(data.to).toBe("bitcoin");
    expect(data.provider).toBe("changelly_v2");
    expect(data.amount).toBe("0.001");
    expect(data.transactionId).toBe(mockPipelineResult.transactionId);
    expect(data.payload.swapId).toBe("mock-swap-id");
    expect(data.operationHash).toBe(mockPipelineResult.operationHash);
    expect(data.swapId).toBe("mock-swap-id");
    expect(data.amountExpectedTo).toBe(mockPipelineResult.amountExpectedTo);
    expect(data.amountExpectedToAtomic).toBe(mockPipelineResult.amountExpectedToAtomic);
    expect(data.magnitudeAwareRate).toBe(mockPipelineResult.magnitudeAwareRate);

    expect(runFullSwapPipelineMock).toHaveBeenCalledTimes(1);
    const pipelineInput = runFullSwapPipelineMock.mock.calls[0][0];
    expect(pipelineInput.provider).toBe("changelly_v2");
    expect(pipelineInput.amount).toBe("0.001");
    expect(pipelineInput.amountInAtomicUnit.toFixed()).toBe("1000000000000000");
    expect(pipelineInput.feeStrategy).toBe("medium");
    expect(pipelineInput.fromAccount.id).toBe(fromDescriptor.id);
    expect(pipelineInput.toAccount.id).toBe(toDescriptor.id);
    expect(pipelineInput.getAccountBridge).toBe(getAccountBridgeMock);
  });

  it("creates an empty destination token account when the token sub-account is missing", async () => {
    const data = await runExecuteSwapCommand({
      ...baseFlags,
      to: USDT_TOKEN_ID,
      "to-account": "ethereum-destination-account",
    });

    expect(data.to).toBe(USDT_TOKEN_ID);
    expect(runFullSwapPipelineMock).toHaveBeenCalledTimes(1);
    const pipelineInput = runFullSwapPipelineMock.mock.calls[0][0];
    expect(pipelineInput.toParentAccount?.id).toBe(ethToDescriptor.id);

    if (pipelineInput.toAccount.type !== "TokenAccount") {
      throw new Error(`Expected destination TokenAccount, got ${pipelineInput.toAccount.type}`);
    }

    expect(pipelineInput.toAccount.parentId).toBe(ethToDescriptor.id);
    expect(pipelineInput.toAccount.token.id).toBe(USDT_TOKEN_ID);
    expect(pipelineInput.toAccount.balance.toFixed()).toBe("0");
    expect(pipelineInput.toAccount.spendableBalance.toFixed()).toBe("0");
  });

  it("still rejects a source token when the token sub-account is missing", async () => {
    await expect(
      executeSwapCommand({
        flags: { ...baseFlags, from: USDT_TOKEN_ID, output: undefined },
        positional: [],
        resolveAccountDescriptor: resolveAccountDescriptorMock,
        integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
        getAccountBridge: getAccountBridgeMock,
        runFullSwapPipeline: runFullSwapPipelineMock,
        findTokenById: findTokenByIdMock,
      }),
    ).rejects.toThrow(`from account has no token sub-account for ${USDT_TOKEN_ID}.`);
    expect(runFullSwapPipelineMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported --provider before running the pipeline", async () => {
    await expect(
      runExecuteSwapCommand({ ...baseFlags, provider: "unknown_provider" }),
    ).rejects.toThrow(/Unsupported swap provider/);
    expect(runFullSwapPipelineMock).not.toHaveBeenCalled();
  });

  it("passes changelly_v2 through to the pipeline when --provider is changelly_v2", async () => {
    await runExecuteSwapCommand({ ...baseFlags, provider: "changelly_v2" });
    const pipelineInput = runFullSwapPipelineMock.mock.calls[0][0];
    expect(pipelineInput.provider).toBe("changelly_v2");
  });
  it("should reject an unknown --from currency id", async () => {
    await expect(
      executeSwapCommand({
        flags: { ...baseFlags, from: "test" },
        positional: [],
        resolveAccountDescriptor: resolveAccountDescriptorMock,
        integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
        getAccountBridge: getAccountBridgeMock,
        runFullSwapPipeline: runFullSwapPipelineMock,
        findTokenById: findTokenByIdMock,
      }),
    ).rejects.toThrow("Unknown source currency (--from): test");
  });

  it("should reject an unknown --to currency id", async () => {
    await expect(
      executeSwapCommand({
        flags: { ...baseFlags, to: "test" },
        positional: [],
        resolveAccountDescriptor: resolveAccountDescriptorMock,
        integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
        getAccountBridge: getAccountBridgeMock,
        runFullSwapPipeline: runFullSwapPipelineMock,
        findTokenById: findTokenByIdMock,
      }),
    ).rejects.toThrow("Unknown destination currency (--to): test");
  });

  it("should reject when --from does not match the source account chain", async () => {
    await expect(
      executeSwapCommand({
        flags: { ...baseFlags, from: "bitcoin", output: undefined },
        positional: [],
        resolveAccountDescriptor: resolveAccountDescriptorMock,
        integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
        getAccountBridge: getAccountBridgeMock,
        runFullSwapPipeline: runFullSwapPipelineMock,
        findTokenById: findTokenByIdMock,
      }),
    ).rejects.toThrow("--from account is ethereum but --from is bitcoin.");
  });

  it("should reject when --to does not match the destination account chain", async () => {
    await expect(
      executeSwapCommand({
        flags: { ...baseFlags, to: "ethereum", output: undefined },
        positional: [],
        resolveAccountDescriptor: resolveAccountDescriptorMock,
        integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
        getAccountBridge: getAccountBridgeMock,
        runFullSwapPipeline: runFullSwapPipelineMock,
        findTokenById: findTokenByIdMock,
      }),
    ).rejects.toThrow("--to account is bitcoin but --to is ethereum.");
  });

  describe("DIE execute pipeline", () => {
    it("should emit a DIE JSON envelope when the DIE pipeline succeeds", async () => {
      const data = await runExecuteSwapCommand(dieBaseFlags);

      expect(data.command).toBe("swap execute");
      expect(data.network).toBe("ethereum:main");
      expect(data.plan).toBe("direct-swap");
      expect(data.from).toBe("ethereum");
      expect(data.to).toBe("bitcoin");
      expect(data.provider).toBe("uniswap");
      expect(data.amount).toBe("0.001");
      expect(data.quoteId).toBe("die-quote-1");
      expect(data.approvalTxHash).toBe("0xapprovalhash");
      expect(data.swapTxHash).toBe("0xswaphash");

      expect(getQuotesMock).toHaveBeenCalledTimes(1);
      const quoteRequest = getQuotesMock.mock.calls[0][0];
      expect(quoteRequest.providers).toEqual(["uniswap"]);
      expect(quoteRequest.data.sendAddress).toBe(fromDescriptor.freshAddress);
      expect(quoteRequest.data.receiveAddress).toBe(toDescriptor.freshAddress);
      expect(quoteRequest.data.sendCurrencyId).toBe("ethereum");
      expect(quoteRequest.data.receiveCurrencyId).toBe("bitcoin");
      expect(quoteRequest.data.amount).toBe("0.001");

      expect(runCliSwapDiePipelineMock).toHaveBeenCalledTimes(1);
      const dieInput = runCliSwapDiePipelineMock.mock.calls[0][0];
      expect(dieInput.quote).toEqual(mockDieQuote);
      expect(dieInput.mainAccount.freshAddress).toBe(fromDescriptor.freshAddress);
      expect(dieInput.fromCurrencyId).toBe("ethereum");
      expect(dieInput.toCurrencyId).toBe("bitcoin");

      expect(runFullSwapPipelineMock).not.toHaveBeenCalled();
    });

    it("should resolve 1inch to oneinch and run the DIE pipeline", async () => {
      const oneInchQuote = { id: "die-quote-2", provider: "oneinch" } as Quote;
      getQuotesMock.mockImplementationOnce(async () => ({
        quotes: [oneInchQuote],
        providerErrors: [],
        warnings: [],
        errors: [],
      }));

      const data = await runExecuteSwapCommand({ ...dieBaseFlags, provider: "1inch" });

      expect(data.provider).toBe("oneinch");
      const quoteRequest = getQuotesMock.mock.calls[0][0];
      expect(quoteRequest.providers).toEqual(["oneinch"]);
      expect(runCliSwapDiePipelineMock).toHaveBeenCalledTimes(1);
      expect(runFullSwapPipelineMock).not.toHaveBeenCalled();
    });

    it("should fall back to the legacy pipeline when DIE planner returns skip", async () => {
      runCliSwapDiePipelineMock.mockImplementationOnce(async () => ({
        plan: "skip",
        skipReason: "dex-approval-blob-missing",
        result: {},
      }));

      const data = await runExecuteSwapCommand(dieBaseFlags);

      expect(data.transactionId).toBe(mockPipelineResult.transactionId);
      expect(data.provider).toBe("uniswap");
      expect(runCliSwapDiePipelineMock).toHaveBeenCalledTimes(1);
      expect(runFullSwapPipelineMock).toHaveBeenCalledTimes(1);
      const pipelineInput = runFullSwapPipelineMock.mock.calls[0][0];
      expect(pipelineInput.provider).toBe("uniswap");
    });

    it("should reject when no DIE quote is returned", async () => {
      getQuotesMock.mockImplementationOnce(async () => ({
        quotes: [],
        providerErrors: [
          {
            provider: "uniswap",
            message: "rate unavailable",
            code: "rate_unavailable",
            type: "fixed",
            parameter: { rate: "rate" },
          },
        ],
        warnings: [],
        errors: [],
      }));

      const writes: string[] = [];
      const restoreCapture = installOutputCapture({
        stdout: chunk => writes.push(chunk),
      });

      try {
        await expect(
          executeSwapCommand({
            flags: dieBaseFlags,
            positional: [],
            resolveAccountDescriptor: resolveAccountDescriptorMock,
            integrateNewAccountDescriptor: integrateNewAccountDescriptorMock,
            getAccountBridge: getAccountBridgeMock,
            runFullSwapPipeline: runFullSwapPipelineMock,
            runCliSwapDiePipeline: runCliSwapDiePipelineMock,
            findTokenById: findTokenByIdMock,
            getQuotes: getQuotesMock,
          }),
        ).rejects.toThrow(CliProcessExitError);
      } finally {
        restoreCapture();
      }

      const data = JSON.parse(writes.join("").trim());
      expect(data.ok).toBe(false);
      expect(data.error.message).toBe("No quote from 'uniswap': uniswap: rate unavailable");
      expect(runCliSwapDiePipelineMock).not.toHaveBeenCalled();
      expect(runFullSwapPipelineMock).not.toHaveBeenCalled();
    });
  });
});
