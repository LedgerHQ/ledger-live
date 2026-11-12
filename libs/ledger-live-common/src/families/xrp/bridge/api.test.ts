import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { getXrpEnabledTokenStandards } from "../config";
import BigNumber from "bignumber.js";
import type { Account, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { buildSubAccounts } from "../../../bridge/generic-coin-framework/buildSubAccounts";
import { buildOptimisticOperation } from "../../../bridge/generic-coin-framework/utils";
import xrpBridgeApi, {
  buildTokenAccountShapes,
  describeOptimisticOperation,
  getAssetFromToken,
  getTokenFromAsset,
} from "./api";

jest.mock("../config", () => ({ getXrpEnabledTokenStandards: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/api/context", () => {
  return { buildContext: jest.fn() };
});

const getXrpEnabledTokenStandardsMock = jest.mocked(getXrpEnabledTokenStandards);
const getAccountInfoMock = jest.fn();
jest.mocked(getCoinModuleApi).mockResolvedValue({ getAccountInfo: getAccountInfoMock } as never);

const ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";
const USDC_CODE = "5553444300000000000000000000000000000000";
const MPT_ID = "01489A324ABE1D127FB71A25754C935239D13C95BC8068E2";

const ripple = makeCurrency("ripple");
const mptAsset = { type: "mpt", assetReference: MPT_ID, assetOwner: ISSUER };

const tokens = ["ripple", "ripple_testnet", "ripple_devnet"].flatMap(currencyId => {
  return [
    makeToken(currencyId, "iou", "USD"),
    makeToken(currencyId, "iou", USDC_CODE),
    makeToken(currencyId, "mpt", MPT_ID),
  ];
});

// Like the CAL: the token identifier matches exactly, the contract address in any case
const findTokenByAddressInCurrencyMock = jest.fn(
  async (address: string, currencyId: string, tokenIdentifier?: string) => {
    const issuer = address.toLowerCase();

    return tokens.find(token => {
      const isSameCurrency = token.parentCurrencyId === currencyId;
      const isSameIssuer = token.contractAddress.toLowerCase() === issuer;
      const isSameReference = token.tokenIdentifier === tokenIdentifier;

      return isSameCurrency && isSameIssuer && isSameReference;
    });
  },
);

function makeCurrency(id: string) {
  return { id } as CryptoCurrency;
}

function makeToken(parentCurrencyId: string, tokenType: string, tokenIdentifier: string) {
  return {
    parentCurrencyId,
    tokenType,
    tokenIdentifier,
    id: `${parentCurrencyId}/${tokenType}/${tokenIdentifier}`,
    contractAddress: ISSUER,
  } as TokenCurrency;
}

function makeTrustSet(assetReference: string) {
  return {
    assetReference,
    family: "xrp",
    mode: "changeTrust" as const,
    amount: new BigNumber("1e47"),
    recipient: "",
    fees: new BigNumber(12),
    assetOwner: ISSUER,
  };
}

beforeAll(() => {
  setCryptoAssetsStore({
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "",
    findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  getXrpEnabledTokenStandardsMock.mockReturnValue(["iou", "mpt"]);
});

describe("getTokenFromAsset", () => {
  it.each(["ripple", "ripple_testnet", "ripple_devnet"])("resolves a token on %s", async id => {
    const asset = { type: "iou", assetReference: "USD", assetOwner: ISSUER };

    const token = await getTokenFromAsset(makeCurrency(id), asset);

    expect(token?.id).toBe(`${id}/iou/USD`);
    expect(getXrpEnabledTokenStandardsMock).toHaveBeenCalledTimes(1);
    expect(getXrpEnabledTokenStandardsMock).toHaveBeenCalledWith(id);
  });

  it("rejects a CAL answer whose issuer differs only by case", async () => {
    const asset = {
      type: "iou",
      assetReference: "USD",
      assetOwner: ISSUER.toLowerCase(),
    };

    await expect(getTokenFromAsset(ripple, asset)).resolves.toBeUndefined();
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledTimes(1);
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledWith(
      asset.assetOwner,
      "ripple",
      "USD",
    );
  });

  it.each([
    ["a 3-character code", "USD", "ripple/iou/USD"],
    ["a 40-hex code", USDC_CODE, `ripple/iou/${USDC_CODE}`],
    ["a 48-hex issuance id", MPT_ID, `ripple/mpt/${MPT_ID}`],
  ])("classifies a generic token by its reference: %s", async (_label, assetReference, id) => {
    const asset = { type: "token", assetReference, assetOwner: ISSUER };

    const token = await getTokenFromAsset(ripple, asset);

    expect(token?.id).toBe(id);
  });

  it("returns nothing for a generic token whose reference has no known shape", async () => {
    const asset = {
      type: "token",
      assetReference: "USDC",
      assetOwner: ISSUER,
    };

    await expect(getTokenFromAsset(ripple, asset)).resolves.toBeUndefined();
  });

  it("returns nothing when the asset type differs from the token's standard", async () => {
    const asset = { type: "iou", assetReference: MPT_ID, assetOwner: ISSUER };

    await expect(getTokenFromAsset(ripple, asset)).resolves.toBeUndefined();
  });

  it("returns nothing for a standard that is not enabled, without a CAL lookup", async () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue(["iou"]);
    const asset = { type: "mpt", assetReference: MPT_ID, assetOwner: ISSUER };

    await expect(getTokenFromAsset(ripple, asset)).resolves.toBeUndefined();
    expect(findTokenByAddressInCurrencyMock).not.toHaveBeenCalled();
  });

  it("returns nothing for the native asset", async () => {
    await expect(getTokenFromAsset(ripple, { type: "native" })).resolves.toBeUndefined();
  });
});

describe("getAssetFromToken", () => {
  const usd = makeToken("ripple_testnet", "iou", "USD");

  it("returns the token's asset", () => {
    expect(getAssetFromToken(usd)).toEqual({
      type: "iou",
      assetReference: "USD",
      assetOwner: ISSUER,
    });
  });

  it("returns the asset of a standard that is not enabled, never a native fallback", () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue([]);

    expect(getAssetFromToken(usd)).toEqual({
      type: "iou",
      assetReference: "USD",
      assetOwner: ISSUER,
    });
  });
});

describe("buildTokenAccountShapes", () => {
  const usdAsset = { type: "iou", assetReference: "USD", assetOwner: ISSUER };
  const usdcAsset = {
    type: "iou",
    assetReference: USDC_CODE,
    assetOwner: ISSUER,
  };

  it("keeps each token of one issuer apart, keyed by its id", async () => {
    getAccountInfoMock.mockResolvedValue({
      type: "xrp",
      tokens: [
        { asset: usdAsset, value: 5n, isLocked: true, limit: 100n, isRippling: false },
        { asset: usdcAsset, value: 7n, isLocked: false, limit: 200n, isRippling: true },
      ],
    });

    const shapes = await buildTokenAccountShapes(ripple, "rAddress");
    const usdResources = shapes["ripple/iou/USD"].xrpResources;
    const usdcResources = shapes[`ripple/iou/${USDC_CODE}`].xrpResources;

    expect(usdResources).toMatchObject({ isLocked: true, isRippling: false });
    expect(usdResources.limit?.toFixed()).toBe("100");
    expect(usdcResources).toMatchObject({ isLocked: false, isRippling: true });
    expect(usdcResources.limit?.toFixed()).toBe("200");
  });

  it("stores an MPT entry without limit or rippling", async () => {
    getAccountInfoMock.mockResolvedValue({
      type: "xrp",
      tokens: [{ asset: mptAsset, value: 1n, isLocked: false, limit: 0n, isRippling: false }],
    });

    const shapes = await buildTokenAccountShapes(ripple, "rAddress");

    expect(shapes).toEqual({ [`ripple/mpt/${MPT_ID}`]: { xrpResources: { isLocked: false } } });
  });

  it("drops an entry with no CAL token or of a standard that is not enabled", async () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue(["iou"]);
    getAccountInfoMock.mockResolvedValue({
      type: "xrp",
      tokens: [
        { asset: { ...usdAsset, assetReference: "EUR" }, value: 1n, isLocked: false, limit: 1n },
        { asset: mptAsset, value: 1n, isLocked: false, limit: 0n },
      ],
    });

    await expect(buildTokenAccountShapes(ripple, "rAddress")).resolves.toEqual({});
  });

  it("reads nothing while no standard is enabled", async () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue([]);

    await expect(buildTokenAccountShapes(ripple, "rAddress")).resolves.toEqual({});
    expect(getAccountInfoMock).not.toHaveBeenCalled();
  });

  it("fails when the read fails", async () => {
    getAccountInfoMock.mockRejectedValue(new Error("node down"));

    await expect(buildTokenAccountShapes(ripple, "rAddress")).rejects.toThrow("node down");
  });
});

describe("xrpBridgeApi", () => {
  it("sets no syncVersion while no standard is enabled", () => {
    getXrpEnabledTokenStandardsMock.mockReturnValue([]);

    const bridgeApi = xrpBridgeApi(ripple);

    expect(bridgeApi).not.toHaveProperty("syncVersion");
  });

  it("puts the enabled standards in syncVersion", () => {
    const bridgeApi = xrpBridgeApi(ripple);

    expect(bridgeApi.syncVersion).toBe("iou,mpt");
    expect(getXrpEnabledTokenStandardsMock).toHaveBeenCalledTimes(1);
    expect(getXrpEnabledTokenStandardsMock).toHaveBeenCalledWith("ripple");
  });

  it("matches tokens on their exact currency code", () => {
    expect(xrpBridgeApi(ripple).exactAssetMatch).toBe(true);
  });

  it("gives a synced opt-in, opt-out or edit its own parent row", () => {
    expect(xrpBridgeApi(ripple).tokenOptParentRow).toBe(true);
  });
});

describe("describeOptimisticOperation", () => {
  const usd = { tokenIdentifier: "USD", contractAddress: ISSUER } as TokenCurrency;
  const usdAccount = { id: "usdAccount", token: usd } as TokenAccount;
  const account = {
    id: "xrpAccount",
    freshAddress: "rSender",
    subAccounts: [usdAccount],
  } as Account;

  it("records an opt-in as OPT_IN with a 0 value, the limit locking nothing", () => {
    const operation = buildOptimisticOperation(
      account,
      makeTrustSet(USDC_CODE),
      undefined,
      describeOptimisticOperation,
    );

    expect(operation).toMatchObject({ type: "OPT_IN", accountId: "xrpAccount" });
    expect(operation.value.toFixed()).toBe("0");
    expect(operation.subOperations).toBeUndefined();
    expect(operation.transactionRaw).toMatchObject({
      assetReference: USDC_CODE,
      assetOwner: ISSUER,
    });
  });

  it("records an edit of a held token as OPT_EDIT with a 0 value", () => {
    const operation = buildOptimisticOperation(
      account,
      makeTrustSet("USD"),
      undefined,
      describeOptimisticOperation,
    );

    expect(operation).toMatchObject({ type: "OPT_EDIT", accountId: "xrpAccount" });
    expect(operation.value.toFixed()).toBe("0");
    expect(operation.subOperations).toBeUndefined();
  });

  it("records an opt-in to the held code of another issuer as OPT_IN", () => {
    const transaction = { ...makeTrustSet("USD"), assetOwner: "rOtherIssuer" };

    expect(describeOptimisticOperation("changeTrust", account, transaction)?.type).toBe("OPT_IN");
  });

  it("keeps the generic description of a send", () => {
    expect(describeOptimisticOperation("send", account, makeTrustSet("USD"))).toBeUndefined();
  });
});

describe("MPT", () => {
  it("turns a held MPT into a token account", async () => {
    const subAccounts = await buildSubAccounts({
      accountId: "xrpAccount",
      allTokenAssetsBalances: [{ asset: mptAsset, value: 3n }],
      syncConfig: { blacklistedTokenIds: [] } as unknown as SyncConfig,
      operations: [],
      getTokenFromAsset: asset => getTokenFromAsset(ripple, asset),
    });

    expect(subAccounts).toEqual([
      expect.objectContaining({
        token: expect.objectContaining({ id: `ripple/mpt/${MPT_ID}` }),
        balance: new BigNumber(3),
      }),
    ]);
  });
});
