import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import network from "@ledgerhq/live-network/network";
import { preload } from "../../modules/erc20";

const currency1 = getCryptoCurrencyById("ethereum");
jest.mock("@ledgerhq/live-network/network");

describe("Ethereum ERC20 module tests", () => {
  it("should not break on malformed dynamic CAL", async () => {
    // @ts-expect-error not casted as jest mock
    network.mockResolvedValueOnce({ data: "ERROR" });
    await expect(preload(currency1)).resolves.not.toThrow();
    await expect(preload(currency1)).resolves.toEqual([]);
    // @ts-expect-error not casted as jest mock
    network.mockResolvedValueOnce({ data: [123] });
    await expect(preload(currency1)).resolves.not.toThrow();
    await expect(preload(currency1)).resolves.toEqual([]);
    // @ts-expect-error not casted as jest mock
    network.mockResolvedValueOnce("ERROR");
    await expect(preload(currency1)).resolves.not.toThrow();
    await expect(preload(currency1)).resolves.toEqual([]);
  });
});
