import type { TokenCurrency } from "@domain/entity-currency-token";
import { getDefaultTrustLimit } from "@ledgerhq/coin-xrp/logic-public";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { getMaxTrustLimitForToken } from "./logicPublic";

jest.mock("@ledgerhq/coin-xrp/logic-public", () => ({ getDefaultTrustLimit: jest.fn() }));
jest.mock("../../bridge/generic-coin-framework/api/context", () => {
  return { buildContext: jest.fn((currencyId: string) => ({ currencyId })) };
});

const getDefaultTrustLimitMock = jest.mocked(getDefaultTrustLimit);

describe("getMaxTrustLimitForToken", () => {
  const usd = {
    parentCurrencyId: "ripple_testnet",
    tokenType: "iou",
    tokenIdentifier: "USD",
    contractAddress: "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV",
  } as TokenCurrency;

  it("asks coin-xrp for the token's limit on its own network, in base units", async () => {
    getDefaultTrustLimitMock.mockResolvedValue(10n ** 47n);

    const limit = await getMaxTrustLimitForToken(usd);

    expect(limit.toFixed()).toBe(`1${"0".repeat(47)}`);
    expect(buildContext).toHaveBeenCalledWith("ripple_testnet");
    expect(getDefaultTrustLimitMock).toHaveBeenCalledWith(
      { currencyId: "ripple_testnet" },
      {
        type: "iou",
        assetReference: "USD",
        assetOwner: usd.contractAddress,
      },
    );
  });
});
