jest.mock("../../api");

import BigNumber from "bignumber.js";
import { rosettaSubmitTransaction } from "../../api";
import { TxType } from "../../types/common";
import { broadcastTransaction } from "./broadcast";

const mockRosettaSubmitTransaction = rosettaSubmitTransaction as jest.MockedFunction<
  typeof rosettaSubmitTransaction
>;

describe("broadcastTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast a payment transaction", async () => {
    mockRosettaSubmitTransaction.mockResolvedValue({
      transaction_identifier: { hash: "tx_hash_123" },
    });

    const result = await broadcastTransaction({
      signature: "sig123",
      transaction: {
        txType: TxType.PAYMENT,
        senderAccount: 0,
        senderAddress: "sender",
        receiverAddress: "receiver",
        amount: 1000,
        fee: new BigNumber(100),
        nonce: new BigNumber(5),
        memo: "test",
        networkId: 1,
      },
    } as any);

    expect(result).toBe("tx_hash_123");
    const calledBlob = JSON.parse(
      (mockRosettaSubmitTransaction.mock.calls[0] as any)[0],
    );
    expect(calledBlob.signature).toBe("sig123");
    expect(calledBlob.payment).not.toBeNull();
    expect(calledBlob.stake_delegation).toBeNull();
  });

  it("should broadcast a delegation transaction", async () => {
    mockRosettaSubmitTransaction.mockResolvedValue({
      transaction_identifier: { hash: "tx_delegate_hash" },
    });

    const result = await broadcastTransaction({
      signature: "sig456",
      transaction: {
        txType: TxType.DELEGATION,
        senderAccount: 0,
        senderAddress: "sender",
        receiverAddress: "delegate_target",
        amount: new BigNumber(0),
        fee: new BigNumber(100),
        nonce: new BigNumber(5),
        memo: null,
        networkId: 1,
      },
    } as any);

    expect(result).toBe("tx_delegate_hash");
    const calledBlob = JSON.parse(
      (mockRosettaSubmitTransaction.mock.calls[0] as any)[0],
    );
    expect(calledBlob.payment).toBeNull();
    expect(calledBlob.stake_delegation).not.toBeNull();
    expect(calledBlob.stake_delegation.new_delegate).toBe("delegate_target");
  });
});
