import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getIssuerFee } from "@ledgerhq/coin-xrp/logic-public";
import {
  MAX_TRUST_LIMIT,
  getIssuerFeeAmount,
  getIssuerFeeForToken,
  isMaxTrustLimit,
} from "./logicPublic";

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
const PROTOCOL_MAX = new BigNumber("9999999999999999e80").shiftedBy(38);

describe("MAX_TRUST_LIMIT", () => {
  it("is the protocol maximum in base units", () => {
    expect(MAX_TRUST_LIMIT).toEqual(PROTOCOL_MAX);
  });
});

describe("isMaxTrustLimit", () => {
  it("is true for the protocol maximum in base units", () => {
    expect(isMaxTrustLimit(PROTOCOL_MAX)).toBe(true);
  });

  it.each([PROTOCOL_MAX.minus(1), new BigNumber(1e9).shiftedBy(38), new BigNumber(0.5)])(
    "is false for %s",
    limit => {
      expect(isMaxTrustLimit(limit)).toBe(false);
    },
  );
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

describe("getIssuerFeeAmount", () => {
  it("is the part of the total spent above the amount on a token send", () => {
    const status = { amount: new BigNumber(200), totalSpent: new BigNumber(201) };

    expect(getIssuerFeeAmount(status)).toEqual(new BigNumber(1));
  });

  it("is null when the token has no fee", () => {
    const status = { amount: new BigNumber(200), totalSpent: new BigNumber(200) };

    expect(getIssuerFeeAmount(status)).toBeNull();
  });
});
