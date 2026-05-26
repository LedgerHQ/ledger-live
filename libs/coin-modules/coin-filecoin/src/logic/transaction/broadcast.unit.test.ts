import { broadcast } from "./broadcast";
import { broadcastTx } from "../../api/api";

jest.mock("../../api/api");
const mockedBroadcastTx = jest.mocked(broadcastTx);

describe("broadcast", () => {
  afterEach(() => jest.resetAllMocks());

  it("parses signed transaction JSON and returns tx hash", async () => {
    mockedBroadcastTx.mockResolvedValue({ hash: "bafy2txhash" });

    const signedTx = JSON.stringify({
      message: {
        version: 0, to: "f1r", from: "f1s", nonce: 1,
        value: "1000", gaslimit: 10000, gasfeecap: "100",
        gaspremium: "10", method: 0, params: "",
      },
      signature: { type: 1, data: "c2lnbmF0dXJl" },
    });

    const result = await broadcast(signedTx);
    expect(result).toBe("bafy2txhash");
    expect(mockedBroadcastTx).toHaveBeenCalledWith(JSON.parse(signedTx));
  });

  it("throws when API returns success but no hash", async () => {
    mockedBroadcastTx.mockResolvedValue({ hash: "" } as any);

    const signedTx = JSON.stringify({
      message: { version: 0, to: "f1r", from: "f1s", nonce: 1, value: "1", gaslimit: 1, gasfeecap: "1", gaspremium: "1", method: 0, params: "" },
      signature: { type: 1, data: "sig" },
    });

    await expect(broadcast(signedTx)).rejects.toThrow("Broadcast failed");
  });
});
