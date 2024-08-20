import { setup, getMockedAgent, getMockedZondaxIcp } from "../test/jest.mocks";
setup();
import { broadcast } from "./broadcast";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { getEmptyAccount, ICP_CURRENCY_MOCK, SAMPLE_PUBLIC_KEY } from "../test/__fixtures__";
import { InternetComputerOperation } from "../types";
import BigNumber from "bignumber.js";
import * as api from "../api";

jest.mock("../api");

describe("broadcast", () => {
  const mockApi = api as jest.Mocked<typeof api>;
  const mockAgent = getMockedAgent();
  const mockIcp = getMockedZondaxIcp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleAccount = getEmptyAccount(ICP_CURRENCY_MOCK);
  sampleAccount.xpub = SAMPLE_PUBLIC_KEY;

  const sampleOperation: InternetComputerOperation = {
    id: "op-id",
    hash: "op-hash",
    type: "OUT",
    value: new BigNumber(1000),
    fee: new BigNumber(100),
    senders: ["sender-addr"],
    recipients: ["recipient-addr"],
    blockHeight: 123,
    blockHash: "block-hash",
    accountId: "test-id",
    date: new Date(),
    extra: {
      memo: "test-memo",
    },
  };

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test("should broadcast a 'send' transaction", async () => {
    const rawData = {
      encodedSignedCallBlob: "deadbeef",
      methodName: "send",
    };
    mockApi.broadcastTxn.mockResolvedValue(new ArrayBuffer(0));

    const result = await broadcast({
      account: sampleAccount,
      signedOperation: {
        operation: sampleOperation,
        rawData,
        signature: "sig",
      },
    });

    expect(mockApi.broadcastTxn).toHaveBeenCalledWith(
      Buffer.from(rawData.encodedSignedCallBlob, "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    expect(result).toBe(sampleOperation);
  });

  test("should handle 'manage_neuron' transaction successfully", async () => {
    const rawData = {
      encodedSignedCallBlob: "deadbeef",
      encodedSignedReadStateBlob: "cafebabe",
      requestId: "req-id",
      methodName: "start_dissolving",
    };
    mockApi.broadcastTxn.mockResolvedValue(new ArrayBuffer(0));
    mockAgent.pollForReadState.mockResolvedValue(Buffer.from(""));
    mockIcp.decodeCanisterIdlFunc.mockReturnValue([{ command: [{}] }]);

    const result = await broadcast({
      account: sampleAccount,
      signedOperation: {
        operation: sampleOperation,
        rawData,
        signature: "sig",
      },
    });

    expect(mockApi.broadcastTxn).toHaveBeenCalledWith(
      Buffer.from(rawData.encodedSignedCallBlob, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      "call",
    );
    expect(mockAgent.pollForReadState).toHaveBeenCalled();
    expect(result).toBe(sampleOperation);
  });

  test("should throw error for 'manage_neuron' transaction on failure", async () => {
    const rawData = {
      encodedSignedCallBlob: "deadbeef",
      encodedSignedReadStateBlob: "cafebabe",
      requestId: "req-id",
      methodName: "start_dissolving",
    };
    mockApi.broadcastTxn.mockResolvedValue(new ArrayBuffer(0));
    mockAgent.pollForReadState.mockResolvedValue(Buffer.from(""));
    mockIcp.decodeCanisterIdlFunc.mockReturnValue([
      { command: [{ Error: { error_message: "neuron failed" } }] },
    ]);

    await expect(
      broadcast({
        account: sampleAccount,
        signedOperation: {
          operation: sampleOperation,
          rawData,
          signature: "sig",
        },
      }),
    ).rejects.toThrow("neuron failed");
  });

  test("should handle 'list_neurons' and update operation extra", async () => {
    const rawData = {
      encodedSignedCallBlob: "deadbeef",
      encodedSignedReadStateBlob: "cafebabe",
      requestId: "req-id",
      methodName: "list_neurons",
    };
    mockApi.broadcastTxn.mockResolvedValue(new ArrayBuffer(0));
    mockAgent.pollForReadState.mockResolvedValue(Buffer.from(""));
    mockIcp.decodeCanisterIdlFunc.mockReturnValue([{ full_neurons: [], neuron_infos: [] }]);

    const result = await broadcast({
      account: sampleAccount,
      signedOperation: {
        operation: sampleOperation,
        rawData,
        signature: "sig",
      },
    });

    expect(mockApi.broadcastTxn).toHaveBeenCalledWith(
      Buffer.from(rawData.encodedSignedCallBlob, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      "call",
    );
    expect(mockAgent.pollForReadState).toHaveBeenCalled();
    expect((result.extra as any).neurons).toBeDefined();
  });

  test("should handle 'create_neuron' and return updated operation", async () => {
    const rawData = {
      encodedSignedCallBlob: "deadbeef",
      methodName: "create_neuron",
    };
    mockApi.broadcastTxn.mockResolvedValue(new ArrayBuffer(0));
    const operationWithMemo = {
      ...sampleOperation,
      extra: { ...sampleOperation.extra, memo: "12345" },
    };
    const createdNeuronId = 123456789n;
    mockIcp.GovernanceCanister.create({
      agent: {},
    }).claimOrRefreshNeuronFromAccount.mockResolvedValue(createdNeuronId);

    const result = await broadcast({
      account: sampleAccount,
      signedOperation: {
        operation: operationWithMemo,
        rawData,
        signature: "sig",
      },
    });

    expect(
      mockIcp.GovernanceCanister.create({
        agent: {},
      }).claimOrRefreshNeuronFromAccount,
    ).toHaveBeenCalled();
    expect((result.extra as any).createdNeuronId).toBe(createdNeuronId.toString());
  });

  test("should handle 'increase_stake' and refresh neuron", async () => {
    const rawData = {
      encodedSignedCallBlob: "deadbeef",
      methodName: "increase_stake",
      neuronId: "98765",
    };
    mockApi.broadcastTxn.mockResolvedValue(new ArrayBuffer(0));

    await broadcast({
      account: sampleAccount,
      signedOperation: {
        operation: sampleOperation,
        rawData,
        signature: "sig",
      },
    });

    expect(
      mockIcp.GovernanceCanister.create({ agent: {} }).claimOrRefreshNeuron,
    ).toHaveBeenCalledWith({
      neuronId: BigInt(rawData.neuronId),
      by: undefined,
    });
  });
});
