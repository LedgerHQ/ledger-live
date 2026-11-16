import type { TokenCurrency } from "@domain/entity-currency-token";
import { MAX_TRUST_LIMIT, getIssuerFee } from "@ledgerhq/coin-xrp/logic-public";
import { getIssuerFeeForToken, getMaxTrustLimitForToken } from "./logicPublic";

jest.mock("@ledgerhq/coin-xrp/logic-public", () => {
  return {
    ...jest.requireActual("@ledgerhq/coin-xrp/logic-public"),
    getIssuerFee: jest.fn(),
  };
});
jest.mock("../../bridge/generic-coin-framework/api/context", () => {
  return { buildContext: jest.fn((currencyId: string) => ({ currencyId })) };
});

const getIssuerFeeMock = jest.mocked(getIssuerFee);

describe("getMaxTrustLimitForToken", () => {
  it("returns the protocol maximum, in base units", () => {
    expect(getMaxTrustLimitForToken().toFixed()).toBe(MAX_TRUST_LIMIT.toString());
  });
});

describe("getIssuerFeeForToken", () => {
  it("asks coin-xrp for the token's issuer fee on its own network", async () => {
    getIssuerFeeMock.mockResolvedValue("0.5");

    const token = {
      parentCurrencyId: "ripple_testnet",
      tokenType: "iou",
      tokenIdentifier: "USD",
      contractAddress: "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV",
    } as TokenCurrency;

    await expect(getIssuerFeeForToken(token)).resolves.toBe("0.5");
    expect(getIssuerFeeMock).toHaveBeenCalledTimes(1);
    expect(getIssuerFeeMock).toHaveBeenCalledWith(
      { currencyId: "ripple_testnet" },
      {
        type: "iou",
        assetReference: "USD",
        assetOwner: token.contractAddress,
      },
    );
  });
});
