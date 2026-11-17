import { showsReceiveOptions } from "../showsReceiveOptions";

const noah = { enabled: true, params: { activeCurrencyIds: ["ethereum/erc20/usd__coin"] } };

describe("showsReceiveOptions", () => {
  it("is off when the noah flag is off", () => {
    expect(showsReceiveOptions({ noah: { enabled: false } })).toBe(false);
  });

  it("is off when the entry point asks for no options", () => {
    expect(showsReceiveOptions({ noah, shouldUseReceiveOptions: false })).toBe(false);
  });

  it("follows the account's asset", () => {
    expect(showsReceiveOptions({ noah, accountAssetId: "ethereum/erc20/usd__coin" })).toBe(true);
    expect(showsReceiveOptions({ noah, accountAssetId: "bitcoin" })).toBe(false);
  });

  it("is on for an asset page when one of its assets has a bank transfer option", () => {
    expect(
      showsReceiveOptions({ noah, pageAssetIds: ["bitcoin", "ethereum/erc20/usd__coin"] }),
    ).toBe(true);
    expect(showsReceiveOptions({ noah, pageAssetIds: ["bitcoin"] })).toBe(false);
  });

  it("is on when the receive starts from nowhere", () => {
    expect(showsReceiveOptions({ noah })).toBe(true);
  });
});
