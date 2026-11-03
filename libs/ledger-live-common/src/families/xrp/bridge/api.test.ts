import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getXrpEnabledTokenStandards } from "../config";
import { getTokenStates } from "@ledgerhq/coin-xrp/logic-public";
import {
  buildTokenAccountShapes,
  computeIntentType,
  describeOptimisticOperation,
  getTokenFromAsset,
} from "./api";

jest.mock("../config", () => ({ getXrpEnabledTokenStandards: jest.fn() }));
const getXrpEnabledTokenStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

jest.mock("@ledgerhq/coin-xrp/logic-public", () => ({ getTokenStates: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/api/context", () => ({
  buildContext: jest.fn(),
}));
const getTokenStatesMock = jest.mocked(getTokenStates);

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

describe("describeOptimisticOperation", () => {
  it("records an opt-in with a 0 value, not its trust limit", () => {
    expect(describeOptimisticOperation("changeTrust")?.value?.toFixed()).toBe("0");
  });

  it("keeps the transaction amount for a send", () => {
    expect(describeOptimisticOperation("send")).toBeUndefined();
  });

  it("records an opt-out as OPT_OUT with a 0 value", () => {
    const described = describeOptimisticOperation("optOut");

    expect(described?.type).toBe("OPT_OUT");
    expect(described?.value?.toFixed()).toBe("0");
  });
});

describe("computeIntentType", () => {
  it.each([
    [undefined, "Payment"],
    ["send", "send"],
    ["changeTrust", "changeTrust"],
    ["optOut", "optOut"],
  ])("maps the mode %s to %s", (mode, intentType) => {
    expect(computeIntentType({ mode })).toBe(intentType);
  });

  it("throws on any other mode", () => {
    expect(() => computeIntentType({ mode: "delegate" })).toThrow("Unsupported transaction mode");
  });
});

describe("buildTokenAccountShapes", () => {
  const IOU_ASSET = { type: "iou" as const, assetReference: "BDI", assetOwner: ISSUER };
  const MPT_ASSET = { type: "mpt" as const, assetReference: MPT_ID, assetOwner: ISSUER };

  beforeAll(() => {
    const listedTokens = [
      { ...tokens[0], id: "ripple/iou/bdi" },
      { ...tokens[1], id: "ripple/mpt/test" },
    ] as TokenCurrency[];
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      getTokensSyncHash: async () => "",
      findTokenByAddressInCurrency: async (_address, _currencyId, tokenIdentifier) => {
        return listedTokens.find(token => token.tokenIdentifier === tokenIdentifier);
      },
    });
  });

  beforeEach(() => {
    getXrpEnabledTokenStandardsMock.mockReturnValue(["iou", "mpt"]);
  });

  it("keys each token of one issuer by its id", async () => {
    getTokenStatesMock.mockResolvedValue([
      { asset: IOU_ASSET, value: 5n, isLocked: false, limit: 100n, isRippling: true },
      { asset: MPT_ASSET, value: 7n, isLocked: true },
    ]);

    const shapes = await buildTokenAccountShapes(currency, "rAddress");

    expect(Object.keys(shapes)).toEqual(["ripple/iou/bdi", "ripple/mpt/test"]);
    expect(shapes["ripple/iou/bdi"].xrpResources.isLocked).toBe(false);
    expect(shapes["ripple/iou/bdi"].xrpResources.isRippling).toBe(true);
    expect(shapes["ripple/iou/bdi"].xrpResources.limit?.toFixed()).toBe("100");
    expect(shapes["ripple/mpt/test"].xrpResources).toEqual({ isLocked: true });
  });

  it("skips a token missing from the CAL", async () => {
    getTokenStatesMock.mockResolvedValue([
      { asset: { ...IOU_ASSET, assetReference: "USD" }, value: 5n, isLocked: false, limit: 1n },
    ]);

    await expect(buildTokenAccountShapes(currency, "rAddress")).resolves.toEqual({});
  });

  it("fails when the node fails, rather than mark every token as no longer held", async () => {
    getTokenStatesMock.mockRejectedValue(new Error("down"));

    await expect(buildTokenAccountShapes(currency, "rAddress")).rejects.toThrow("down");
  });
});
