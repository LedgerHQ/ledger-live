import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";
import { broadcastTx } from "../../bridge/bridgeHelpers/api";
import broadcast from "../../broadcast";
import { buildOptimisticOperation } from "../../signOperation";
import { account, transaction } from "../fixtures/common.fixtures";

jest.mock("../../bridge/bridgeHelpers/api");
const mockedHash = "validHash";

describe("broadcast", () => {
  beforeAll(() => {
    const broadcastTxMock = jest.mocked(broadcastTx);
    broadcastTxMock.mockReturnValue(Promise.resolve(mockedHash));
  });

  it("should broadcast the coin transaction and add the hash in the optimistic transaction", async () => {
    const optimisticCoinOperation = buildOptimisticOperation(account, transaction);

    const finalOperation = await broadcast({
      account,
      signedOperation: {
        operation: optimisticCoinOperation,
        signature: "0xS1gn4tUR3",
      },
    });

    expect(broadcastTx).toHaveBeenCalled();
    expect(finalOperation).toEqual({
      ...optimisticCoinOperation,
      id: encodeOperationId(account.id, mockedHash, "OUT"),
      hash: mockedHash,
      subOperations: [],
      nftOperations: [],
    });
  });
});
