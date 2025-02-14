import coinConfig from "../config";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  it("returns correct value", async () => {
    const result = await getBalance("TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9");

    expect(result).toBeUndefined();
  });
});
