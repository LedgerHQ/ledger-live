import { broadcastTransaction } from "../../api/network";
import broadcast from "../../broadcast";
import { account, operation, rawData } from "../fixtures/common.fixtures";

jest.mock("../../api/network");

describe("broadcast", () => {
  beforeAll(() => {
    const broadcastTxMock = jest.mocked(broadcastTransaction);
    broadcastTxMock.mockReturnValue(Promise.resolve());
  });

  it("should broadcast the coin transaction and add the hash in the optimistic transaction", async () => {
    const finalOperation = await broadcast({
      account,
      signedOperation: {
        operation,
        rawData,
        signature: "",
      },
    });

    expect(broadcastTransaction).toHaveBeenCalled();
    expect(finalOperation).toEqual(operation);
  });
});
