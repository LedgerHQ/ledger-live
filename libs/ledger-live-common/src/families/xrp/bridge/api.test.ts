import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getXrpEnabledTokenStandards } from "../config";
import { getTokenFromAsset } from "./api";

jest.mock("../config", () => ({ getXrpEnabledTokenStandards: jest.fn() }));
const getXrpEnabledTokenStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

const currency = { id: "ripple" } as CryptoCurrency;
const ISSUER = "r9fnpoGUNqCWMppMStPEQY9R4UEbpCek4";
const MPT_ID = "01489A324ABE1D127FB71A25754C935239D13C95BC8068E2";
const tokens = [
  { tokenType: "iou", tokenIdentifier: "BDI", contractAddress: ISSUER },
  { tokenType: "mpt", tokenIdentifier: MPT_ID, contractAddress: ISSUER },
] as TokenCurrency[];

beforeAll(() => {
  setCryptoAssetsStore({
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "",
    findTokenByAddressInCurrency: async (address, currencyId, tokenIdentifier) => {
      if (currencyId !== "ripple") return undefined;

      return tokens.find(token => {
        const isSameIssuer = token.contractAddress === address;
        const isSameCurrency = token.tokenIdentifier === tokenIdentifier;
        return isSameIssuer && isSameCurrency;
      });
    },
  });
});

describe("getTokenFromAsset", () => {
  it("returns a listed token whose standard is enabled", async () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue(["iou", "mpt"]);

    await expect(
      getTokenFromAsset(currency, { type: "iou", assetReference: "BDI", assetOwner: ISSUER }),
    ).resolves.toBe(tokens[0]);
    await expect(
      getTokenFromAsset(currency, { type: "mpt", assetReference: MPT_ID, assetOwner: ISSUER }),
    ).resolves.toBe(tokens[1]);
    expect(getXrpEnabledTokenStandardsMock).toHaveBeenCalledWith(currency);
  });

  it("returns nothing for a listed token whose standard is not enabled", async () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue(["iou"]);

    await expect(
      getTokenFromAsset(currency, { type: "mpt", assetReference: MPT_ID, assetOwner: ISSUER }),
    ).resolves.toBeUndefined();
  });

  it("returns nothing when no standard is enabled", async () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue([]);

    await expect(
      getTokenFromAsset(currency, { type: "iou", assetReference: "BDI", assetOwner: ISSUER }),
    ).resolves.toBeUndefined();
  });
});
