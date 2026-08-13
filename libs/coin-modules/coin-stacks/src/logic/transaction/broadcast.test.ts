import { broadcastTx } from "../../network/api";
import { broadcast } from "./broadcast";

jest.mock("../../network/api");

describe("broadcast", () => {
  it("strips a 0x prefix, sends the raw bytes, and returns the tx hash", async () => {
    (broadcastTx as jest.Mock).mockResolvedValue("0xabc123");

    const result = await broadcast("0xdeadbeef");

    expect(broadcastTx).toHaveBeenCalledWith(Buffer.from("deadbeef", "hex"));
    expect(result).toBe("0xabc123");
  });
});
