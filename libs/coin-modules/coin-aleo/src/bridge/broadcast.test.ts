import BigNumber from "bignumber.js";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation } from "@ledgerhq/types-live";
import aleoCoinConfig from "../config";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { broadcast as logicBroadcast } from "../logic/broadcast";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { broadcast as bridgeBroadcast } from "./broadcast";
import type { DelegatedProvingResponse } from "../types";

jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../logic/broadcast");
jest.mock("../config");

const mockLogicBroadcast = jest.mocked(logicBroadcast);
const mockPatchOperationWithHash = jest.mocked(patchOperationWithHash);
const mockAleoConfig = jest.mocked(aleoCoinConfig);

describe("bridge broadcast", () => {
  const account = getMockedAccount();
  const mockConfig = getMockedConfig("testnet");

  beforeEach(() => {
    jest.clearAllMocks();
    mockAleoConfig.getCoinConfig.mockReturnValue(mockConfig);
  });

  it("should broadcast the signed operation and return an operation with the hash and firstTransitionId", async () => {
    const transactionId = "at1broadcast_hash_123";
    const firstTransitionId = "au1transition_id_456";
    const signature = "signed_tx_hex_123";

    const mockTransaction: DelegatedProvingResponse["transaction"] = {
      type: "execute",
      id: transactionId,
      execution: {
        transitions: [
          {
            id: firstTransitionId,
            program: "credits.aleo",
            function: "transfer_public",
            inputs: [],
            outputs: [],
            tpk: "",
            tcm: "",
            scm: "",
          },
        ],
        global_state_root: "",
        proof: "",
        fee: {
          transition: {
            id: "au1fee",
            program: "credits.aleo",
            function: "fee_public",
            inputs: [],
            outputs: [],
            tpk: "",
            tcm: "",
            scm: "",
          },
        },
      },
    };
    mockLogicBroadcast.mockResolvedValueOnce(mockTransaction);

    const mockOperation: Operation = {
      id: "op123",
      hash: "",
      type: "OUT",
      value: new BigNumber(1000),
      fee: new BigNumber(100),
      blockHeight: null,
      blockHash: null,
      accountId: account.id,
      senders: [account.freshAddress],
      recipients: ["aleo1recipient123"],
      date: new Date(),
      extra: {},
    };

    const patchedOperation: Operation = { ...mockOperation, hash: transactionId };
    mockPatchOperationWithHash.mockReturnValueOnce(patchedOperation);

    const result = await bridgeBroadcast({
      account,
      signedOperation: { signature, operation: mockOperation },
    });

    expect(mockLogicBroadcast).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      account,
      signedTx: signature,
    });
    expect(mockPatchOperationWithHash).toHaveBeenCalledWith(mockOperation, transactionId);
    expect(result).toEqual({
      ...patchedOperation,
      extra: { firstTransitionId },
    });
  });
});
