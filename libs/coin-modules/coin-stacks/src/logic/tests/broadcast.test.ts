import { broadcastTx } from "../../network/api";
import { broadcast } from "../broadcast";
import { mockStacksConfig } from "../../test/context";

jest.mock("../../network/api");

describe("broadcast", () => {
  it("strips a 0x prefix, sends the raw bytes, and returns the tx hash", async () => {
    (broadcastTx as jest.Mock).mockResolvedValue("0xabc123");

    const result = await broadcast(mockStacksConfig, "0xdeadbeef");

    expect(broadcastTx).toHaveBeenCalledWith(mockStacksConfig, Buffer.from("deadbeef", "hex"));
    expect(result).toBe("0xabc123");
  });
});
