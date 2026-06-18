import { ETH_SYNC_ROUTES } from "../../helpers/eth-sync-routes";
import { MockServer } from "../../helpers/mock-server";
import "../../../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { getAccountBridge as getLiveAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { installOutputCapture } from "../../../shared/ui";
import type { AccountDescriptor } from "../../../wallet/models";
import { MOCK_ETH_DESCRIPTOR } from "../../../test/helpers/constants";
import { USDT_CONTRACT } from "../../helpers/cal-fixtures";
import { executeSwapCommand, type SwapExecuteFlags } from "../../../commands/swap/execute";
import type { FullSwapPipelineInput } from "../../../commands/swap/cli-swap-pipeline";

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
  amountExpectedTo: "1000000000000000000",
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

function makeAccount(descriptor: AccountDescriptor): Account {
  const family = descriptor.currencyId === "bitcoin" ? "bitcoin" : "ethereum";
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
      findTokenById: findTokenByIdMock,
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
});
