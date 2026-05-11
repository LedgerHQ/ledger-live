import "../../live-common-setup";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { getAccountBridge as getLiveAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { installOutputCapture } from "../../shared/ui";
import type { AccountDescriptor } from "../../wallet/models";
import { MOCK_ETH_DESCRIPTOR } from "../../test/helpers/constants";
import { executeSwapCommand, type SwapExecuteFlags } from "./execute";
import type { FullSwapPipelineInput } from "./cli-swap-pipeline";

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
  id: "js:2:ethereum:to:",
  currencyId: "ethereum",
  freshAddress: "0x0000000000000000000000000000000000000007",
  seedIdentifier: "",
  derivationMode: "",
  index: 1,
};

const baseFlags: SwapExecuteFlags = {
  provider: "changelly",
  amount: "0.001",
  account: MOCK_ETH_DESCRIPTOR,
  "to-account": "destination-account",
  "fee-strategy": "medium",
  "dry-run": false,
  output: "json",
};

function makeAccount(descriptor: AccountDescriptor): Account {
  return {
    type: "Account",
    id: descriptor.id,
    freshAddress: descriptor.freshAddress,
    currency: { id: descriptor.currencyId, family: "ethereum" },
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
  return input === baseFlags.account ? fromDescriptor : toDescriptor;
});

const integrateNewAccountDescriptorMock = mock(async (descriptor: AccountDescriptor) => {
  return makeAccount(descriptor);
});

const getAccountBridgeMockFn = mock(() => ({}));
const getAccountBridgeMock = getAccountBridgeMockFn as unknown as typeof getLiveAccountBridge;

const runFullSwapPipelineMock = mock((input: FullSwapPipelineInput) =>
  Promise.resolve({
    ...mockPipelineResult,
    ...(input.dryRun ? { dryRun: true } : {}),
  }),
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
    });
  } finally {
    restoreCapture();
  }

  return JSON.parse(writes.join("").trim());
}

describe("executeSwapCommand", () => {
  beforeEach(() => {
    resolveAccountDescriptorMock.mockClear();
    integrateNewAccountDescriptorMock.mockClear();
    getAccountBridgeMockFn.mockClear();
    runFullSwapPipelineMock.mockClear();
  });

  it("should emit a swap execute JSON envelope when the pipeline succeeds", async () => {
    const data = await runExecuteSwapCommand();

    expect(data.command).toBe("swap execute");
    expect(data.network).toBe("ethereum:main");
    expect(data.provider).toBe("changelly");
    expect(data.amount).toBe("0.001");
    expect(data.transactionId).toBe(mockPipelineResult.transactionId);
    expect(data.payload.swapId).toBe("mock-swap-id");
    expect(data.operationHash).toBe(mockPipelineResult.operationHash);
    expect(data.swapId).toBe("mock-swap-id");
    expect(data.amountExpectedTo).toBe(mockPipelineResult.amountExpectedTo);
    expect(data.magnitudeAwareRate).toBe(mockPipelineResult.magnitudeAwareRate);

    expect(runFullSwapPipelineMock).toHaveBeenCalledTimes(1);
    const pipelineInput = runFullSwapPipelineMock.mock.calls[0][0];
    expect(pipelineInput.provider).toBe("changelly");
    expect(pipelineInput.amount).toBe("0.001");
    expect(pipelineInput.amountInAtomicUnit.toFixed()).toBe("1000000000000000");
    expect(pipelineInput.feeStrategy).toBe("medium");
    expect(pipelineInput.dryRun).toBe(false);
    expect(pipelineInput.fromAccount.id).toBe(fromDescriptor.id);
    expect(pipelineInput.toAccount.id).toBe(toDescriptor.id);
    expect(pipelineInput.getAccountBridge).toBe(getAccountBridgeMock);
  });

  it("should omit operationHash and forward dryRun when dry-run is enabled", async () => {
    const data = await runExecuteSwapCommand({ ...baseFlags, "dry-run": true });

    expect(data.command).toBe("swap execute");
    expect(data.dry_run).toBe(true);
    expect(data.operationHash).toBeUndefined();
    expect(runFullSwapPipelineMock).toHaveBeenCalledTimes(1);
    expect(runFullSwapPipelineMock.mock.calls[0][0].dryRun).toBe(true);
  });
});
