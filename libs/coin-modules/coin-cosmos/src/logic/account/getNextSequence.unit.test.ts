import { CosmosAPI } from "../../network/Cosmos";
import { getNextSequence } from "./getNextSequence";

describe("logic/account/getNextSequence", () => {
  it("returns the account sequence as a bigint", async () => {
    const api = {
      getAccount: jest
        .fn()
        .mockResolvedValue({ accountNumber: 7, sequence: 42, pubKeyType: "", pubKey: "" }),
    } as unknown as CosmosAPI;

    const seq = await getNextSequence(api, "cosmos1a");

    expect(api.getAccount).toHaveBeenCalledWith("cosmos1a");
    expect(seq).toBe(42n);
  });
});
