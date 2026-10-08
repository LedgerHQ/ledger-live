import { getCoinModuleApi } from "./api";
import { genericBroadcast } from "./broadcast";

jest.mock("./api", () => ({
  getCoinModuleApi: jest.fn(),
}));

describe("genericBroadcast", () => {
  it("propagates errors from coin-framework", async () => {
    (getCoinModuleApi as jest.Mock).mockResolvedValue({
      broadcast: jest.fn().mockRejectedValue(new Error("Broadcast Error")),
    });

    const broadcast = genericBroadcast("network", "local");

    await expect(
      broadcast({
        signedOperation: { signature: "", operation: {} },
        account: { currency: { id: "network" } },
      } as any),
    ).rejects.toThrow("Broadcast Error");
  });

  it("broadcasts the family prerequisites first, in order, and returns the operation's own hash", async () => {
    const sent: string[] = [];
    (getCoinModuleApi as jest.Mock).mockResolvedValue({
      broadcast: jest.fn(async (_context, signed: string) => {
        sent.push(signed);
        return `hash-${signed}`;
      }),
    });

    const operation = await genericBroadcast(
      "network",
      "local",
    )({
      signedOperation: {
        signature: "wrap",
        operation: { id: "op", hash: "" },
        rawData: { prerequisites: ["approve"] },
      },
      account: { currency: { id: "network" } },
    } as any);

    expect(sent).toEqual(["approve", "wrap"]);
    expect(operation.hash).toBe("hash-wrap");
  });
});
