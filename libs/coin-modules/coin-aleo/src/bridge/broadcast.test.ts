import BigNumber from "bignumber.js";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation } from "@ledgerhq/types-live";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { broadcast as logicBroadcast } from "../logic/broadcast";
import { broadcast as bridgeBroadcast } from "./broadcast";

jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../logic/broadcast");

const mockLogicBroadcast = jest.mocked(logicBroadcast);
const mockPatchOperationWithHash = jest.mocked(patchOperationWithHash);

describe("bridge broadcast", () => {
  const account = getMockedAccount();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast the signed operation and return an operation with the hash", async () => {
    const hash = "at1broadcast_hash_123";
    const signature = "signed_tx_hex_123";
    mockLogicBroadcast.mockResolvedValueOnce(hash);

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

    const patchedOperation: Operation = { ...mockOperation, hash };
    mockPatchOperationWithHash.mockReturnValueOnce(patchedOperation);

    const result = await bridgeBroadcast({
      account,
      signedOperation: { signature, operation: mockOperation },
    });

    expect(mockLogicBroadcast).toHaveBeenCalledTimes(1);
    expect(mockLogicBroadcast.mock.lastCall).toEqual([{ account, signedTx: signature }]);
    expect(mockPatchOperationWithHash).toHaveBeenCalledTimes(1);
    expect(mockPatchOperationWithHash.mock.lastCall).toEqual([mockOperation, hash]);
    expect(result).toEqual(patchedOperation);
  });
});
