import { pickContactAddressForCurrency } from "../pickContactAddressForCurrency";

describe("pickContactAddressForCurrency", () => {
  it("selects the address that matches the currency id among several network addresses", () => {
    const ethAddress = {
      id: "eth",
      currencyId: "ethereum",
      address: "0xeth",
    };
    const usdcAddress = {
      id: "usdc",
      currencyId: "ethereum/erc20/usd_coin",
      address: "0xusdc",
    };

    expect(
      pickContactAddressForCurrency([ethAddress, usdcAddress], "ethereum/erc20/usd_coin"),
    ).toBe(usdcAddress);
  });

  it("falls back to the only address when there is no exact currency match", () => {
    const ethAddress = {
      id: "eth",
      currencyId: "ethereum",
      address: "0xeth",
    };

    expect(pickContactAddressForCurrency([ethAddress], "ethereum/erc20/usd_coin")).toBe(ethAddress);
  });

  it("does not pick an address when several addresses share the requested currency", () => {
    expect(
      pickContactAddressForCurrency(
        [
          { id: "eth-1", currencyId: "ethereum", address: "0x123" },
          { id: "eth-2", currencyId: "ethereum", address: "0x456" },
        ],
        "ethereum",
      ),
    ).toBeUndefined();
  });

  it("does not pick an address when several candidates remain without an exact currency match", () => {
    expect(
      pickContactAddressForCurrency(
        [
          { id: "eth", currencyId: "ethereum", address: "0xeth" },
          { id: "usdc", currencyId: "ethereum/erc20/usd_coin", address: "0xusdc" },
        ],
        "ethereum/erc20/usd_tether",
      ),
    ).toBeUndefined();
  });
});
