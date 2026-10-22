import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountExplorerUrl } from "./getAccountExplorerUrl";

const bitcoin = getCryptoCurrencyById("bitcoin");

describe("getAccountExplorerUrl", () => {
  it("builds the address URL from the currency's default explorer", () => {
    expect(getAccountExplorerUrl({ currency: bitcoin, freshAddress: "bc1qaddress" })).toBe(
      "https://blockstream.info/address/bc1qaddress",
    );
  });

  it("is undefined when the currency has no explorer", () => {
    expect(
      getAccountExplorerUrl({ currency: { explorerViews: [] }, freshAddress: "bc1qaddress" }),
    ).toBeUndefined();
  });
});
