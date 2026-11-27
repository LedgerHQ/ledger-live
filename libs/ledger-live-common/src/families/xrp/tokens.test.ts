import BigNumber from "bignumber.js";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge";
import { xrpConfig } from "./config";
import { MAX_TRUST_LIMIT } from "./logicPublic";
import {
  enabledXrpTokenStandards,
  filterTokenOptions,
  formatIssuerFee,
  formatLongTrustLimit,
  formatTrustLimit,
  getDefaultTrustLimit,
  getLimitError,
  getManagedTokenAccounts,
  getMinimumAmount,
  getReleasedReserve,
  getRemoveBlocker,
  hasPendingXrpTokenRemoval,
  heldXrpTokenIds,
  isLimitBelowBalance,
  isMatchingTokenSearch,
  makeChangeTrustTransaction,
  makeOptOutTransaction,
  standardOf,
  toTrustLineFields,
} from "./tokens";
import type { TransactionStatus } from "./types";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_REMOVAL,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "./__mocks__/xrpAccount.mock";
import {
  xrpIouToken,
  xrpMainnetToken,
  xrpMptToken,
  xrpRlusdToken,
} from "./__mocks__/xrpCurrency.mock";

const unit = xrpRlusdToken.units[0];

function enableTokenStandards(currencyId: string, getStandards: () => string[]) {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(xrpConfig);
    LiveConfig.setProvider({
      getValueByKey: (key: string) => {
        if (key !== `config_currency_${currencyId}`) return undefined;

        return { enabledTokenStandards: getStandards() };
      },
    });
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });
}

function withPending(operation: Operation) {
  return { ...XRP_ACCOUNT, pendingOperations: [operation] };
}

function makeStatus(
  errors: Record<string, Error> = {},
  warnings: Record<string, Error> = {},
): TransactionStatus {
  return {
    errors,
    warnings,
    estimatedFees: new BigNumber(12),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(12),
  };
}

function makeError(name: string, fields: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(name), { name, ...fields });
}

function toBaseUnits(value: string): BigNumber {
  return new BigNumber(value).shiftedBy(unit.magnitude);
}

function formatLimit(limit: BigNumber) {
  return formatTrustLimit({
    limit,
    unit,
    locale: "en-US",
    discreet: false,
    maximumLabel: "Maximum",
  });
}

describe("enabledXrpTokenStandards and standardOf", () => {
  enableTokenStandards(XRP_ACCOUNT.currency.id, () => ["iou"]);

  it("matches a token only when its standard is enabled", () => {
    const standards = enabledXrpTokenStandards(XRP_ACCOUNT.currency.id);

    expect(standardOf(standards, xrpIouToken)).toBe("iou");
    expect(standardOf(standards, xrpMptToken)).toBeUndefined();
  });
});

describe("heldXrpTokenIds", () => {
  it("keeps the token accounts that still have xrpResources", () => {
    const account = {
      ...XRP_ACCOUNT,
      subAccounts: [XRP_MPT_TOKEN_ACCOUNT, XRP_REMOVED_TOKEN_ACCOUNT],
    };

    expect(heldXrpTokenIds(account)).toEqual(new Set([xrpMptToken.id]));
  });
});

describe("hasPendingXrpTokenRemoval", () => {
  it("finds a pending removal of the token", () => {
    expect(hasPendingXrpTokenRemoval(withPending(XRP_IOU_REMOVAL), xrpIouToken)).toBe(true);
  });

  it("ignores a pending removal of another token", () => {
    expect(hasPendingXrpTokenRemoval(withPending(XRP_IOU_REMOVAL), xrpMptToken)).toBe(false);
  });

  it("ignores a pending operation that is not a removal", () => {
    const optIn: Operation = { ...XRP_IOU_REMOVAL, type: "OPT_IN" };

    expect(hasPendingXrpTokenRemoval(withPending(optIn), xrpIouToken)).toBe(false);
  });
});

describe("getManagedTokenAccounts", () => {
  let standards: string[];
  enableTokenStandards(XRP_ACCOUNT.currency.id, () => standards);

  beforeEach(() => {
    standards = ["iou", "mpt"];
  });

  it("returns the held tokens of every enabled standard", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT, XRP_MPT_TOKEN_ACCOUNT] };

    expect(getManagedTokenAccounts(account)).toEqual([
      XRP_IOU_TOKEN_ACCOUNT,
      XRP_MPT_TOKEN_ACCOUNT,
    ]);
  });

  it("leaves out a removed token, which has no resources", () => {
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] };

    expect(getManagedTokenAccounts(account)).toEqual([]);
  });

  it("leaves out a token whose standard is disabled", () => {
    standards = ["mpt"];
    const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT, XRP_MPT_TOKEN_ACCOUNT] };

    expect(getManagedTokenAccounts(account)).toEqual([XRP_MPT_TOKEN_ACCOUNT]);
  });

  it("returns nothing while no standard is enabled", () => {
    standards = [];

    expect(getManagedTokenAccounts(XRP_ACCOUNT_WITH_TOKEN)).toEqual([]);
  });

  it("returns nothing for an account without sub accounts", () => {
    expect(getManagedTokenAccounts({ ...XRP_ACCOUNT, subAccounts: undefined })).toEqual([]);
  });
});

describe("getRemoveBlocker", () => {
  it("allows the removal of a held token", () => {
    expect(getRemoveBlocker(XRP_ACCOUNT_WITH_TOKEN, XRP_IOU_TOKEN_ACCOUNT)).toBeUndefined();
  });

  it("blocks the removal while a removal of the token is pending", () => {
    const account = { ...XRP_ACCOUNT_WITH_TOKEN, pendingOperations: [XRP_IOU_REMOVAL] };

    expect(getRemoveBlocker(account, XRP_IOU_TOKEN_ACCOUNT)).toBe("pending");
  });

  it("blocks the removal of a frozen token", () => {
    const frozen = {
      ...XRP_IOU_TOKEN_ACCOUNT,
      xrpResources: { ...XRP_IOU_TOKEN_ACCOUNT.xrpResources, isLocked: true },
    };

    expect(getRemoveBlocker(XRP_ACCOUNT_WITH_TOKEN, frozen)).toBe("frozen");
  });
});

describe("filterTokenOptions", () => {
  const usdc: TokenCurrency = {
    ...xrpIouToken,
    id: TokenCurrencyIdSchema.parse("ripple_testnet/iou/usdc"),
  };
  let standards: string[];
  enableTokenStandards(XRP_ACCOUNT.currency.id, () => standards);

  beforeEach(() => {
    standards = ["iou", "mpt"];
  });

  it("keeps only the tokens of the account's network", () => {
    expect(filterTokenOptions([xrpIouToken, xrpMainnetToken], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("keeps only the tokens whose standard is enabled", () => {
    standards = ["iou"];

    expect(filterTokenOptions([xrpIouToken, xrpMptToken], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("lists nothing when no standard is enabled", () => {
    standards = [];

    expect(filterTokenOptions([xrpIouToken, xrpMptToken], XRP_ACCOUNT)).toEqual([]);
  });

  it("drops a held token but lists a removed one again", () => {
    const account = {
      ...XRP_ACCOUNT,
      subAccounts: [XRP_IOU_TOKEN_ACCOUNT, { ...XRP_REMOVED_TOKEN_ACCOUNT, token: usdc }],
    };

    expect(filterTokenOptions([xrpIouToken, usdc], account)).toEqual([usdc]);
  });

  it("drops a delisted token", () => {
    const delisted = { ...xrpMptToken, delisted: true };

    expect(filterTokenOptions([xrpIouToken, delisted], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("drops a token the account issues", () => {
    const ownToken = { ...xrpMptToken, contractAddress: XRP_ACCOUNT.freshAddress };

    expect(filterTokenOptions([xrpIouToken, ownToken], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });
});

describe("isMatchingTokenSearch", () => {
  it.each([
    ["name", "test mpt"],
    ["ticker", "tmpt"],
    ["issuer", xrpMptToken.contractAddress.toLowerCase()],
  ])("matches the %s", (_field, query) => {
    expect(isMatchingTokenSearch(xrpMptToken, query)).toBe(true);
  });

  it("matches nothing else", () => {
    expect(isMatchingTokenSearch(xrpMptToken, "rlusd")).toBe(false);
  });
});

describe("makeOptOutTransaction", () => {
  it("opts out of a held token on the parent account, with no amount", async () => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);

    const transaction = makeOptOutTransaction(bridge, XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT.token);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).toMatchObject({
      mode: "optOut",
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
      amount: new BigNumber(0),
    });
  });
});

describe("makeChangeTrustTransaction", () => {
  it("edits a held token's limit on the parent account, without subAccountId", async () => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);

    const transaction = makeChangeTrustTransaction(
      bridge,
      XRP_ACCOUNT,
      toTrustLineFields(XRP_IOU_TOKEN_ACCOUNT),
    );

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).toMatchObject({
      mode: "changeTrust",
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
      amount: XRP_IOU_TOKEN_ACCOUNT.xrpResources?.limit,
    });
  });

  it("starts an add with no token picked and no subAccountId", async () => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);

    const transaction = makeChangeTrustTransaction(bridge, XRP_ACCOUNT, undefined);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).not.toHaveProperty("assetReference");
    expect(transaction).not.toHaveProperty("noRipple");
    expect(transaction.mode).toBe("changeTrust");
  });

  it.each([
    [true, false],
    [false, true],
    [undefined, true],
  ])("resends isRippling %s on an edit as noRipple %s", async (isRippling, noRipple) => {
    const bridge = await getAccountBridge(XRP_ACCOUNT);
    const limit = new BigNumber(1000).shiftedBy(38);
    const tokenAccount = makeXrpTokenAccount({ limit, isRippling });

    const transaction = makeChangeTrustTransaction(
      bridge,
      XRP_ACCOUNT,
      toTrustLineFields(tokenAccount),
    );

    expect(transaction).toMatchObject({ noRipple, mode: "changeTrust", amount: limit });
  });
});

describe("getDefaultTrustLimit", () => {
  it("starts an IOU at the protocol maximum", () => {
    expect(getDefaultTrustLimit(xrpIouToken)).toEqual(MAX_TRUST_LIMIT);
  });

  it("starts an MPT at 0", () => {
    expect(getDefaultTrustLimit(xrpMptToken)).toEqual(new BigNumber(0));
  });
});

describe("isLimitBelowBalance", () => {
  const balance = new BigNumber(100);

  it("flags a limit below the held balance", () => {
    expect(isLimitBelowBalance(new BigNumber(50), balance)).toBe(true);
  });

  it("accepts a limit equal to the held balance", () => {
    expect(isLimitBelowBalance(balance, balance)).toBe(false);
  });

  it("leaves a 0 limit to its own error", () => {
    expect(isLimitBelowBalance(new BigNumber(0), balance)).toBe(false);
  });
});

describe("getLimitError", () => {
  it("returns an error about the limit", () => {
    const error = makeError("XrpTrustLimitZero");

    expect(getLimitError(makeStatus({ amount: error }))).toBe(error);
  });

  it("ignores another amount error", () => {
    const error = makeError("NotEnoughSpendableBalance");

    expect(getLimitError(makeStatus({ amount: error }))).toBeUndefined();
  });
});

describe("getMinimumAmount", () => {
  it("reads the XRP the account lacks", () => {
    const error = makeError("NotEnoughSpendableBalance", { minimumAmount: "0.2 XRP" });

    expect(getMinimumAmount(error)).toBe("0.2 XRP");
  });

  it("returns nothing for another error", () => {
    const error = makeError("XrpTrustLimitZero", { minimumAmount: "0.2 XRP" });

    expect(getMinimumAmount(error)).toBeUndefined();
    expect(getMinimumAmount(undefined)).toBeUndefined();
  });
});

describe("getReleasedReserve", () => {
  it("reads the reserve a removal frees", () => {
    const warning = makeError("XrpReserveRelease", { amount: "0.2 XRP" });

    expect(getReleasedReserve(makeStatus({}, { reserve: warning }))).toBe("0.2 XRP");
  });

  it("returns nothing for a reserve increase", () => {
    const warning = makeError("XrpReserveIncrease", { amount: "0.2 XRP" });

    expect(getReleasedReserve(makeStatus({}, { reserve: warning }))).toBeUndefined();
  });
});

describe("formatLongTrustLimit", () => {
  it("keeps every significant digit of a limit above 16 integer digits", () => {
    const formatted = formatLongTrustLimit(toBaseUnits("9999999999999999e79"), unit, "en-US");

    expect(formatted).toBe(`9.999999999999999e94 ${unit.code}`);
  });

  it("uses the decimal separator of the locale", () => {
    expect(formatLongTrustLimit(toBaseUnits("15e19"), unit, "fr-FR")).toBe(`1,5e20 ${unit.code}`);
  });

  it("returns null for a limit of 16 integer digits", () => {
    expect(formatLongTrustLimit(toBaseUnits("9999999999999999"), unit, "en-US")).toBeNull();
  });

  it("formats a limit of 17 integer digits", () => {
    expect(formatLongTrustLimit(toBaseUnits("1e16"), unit, "en-US")).toBe(`1e16 ${unit.code}`);
  });
});

describe("formatTrustLimit", () => {
  it("names the protocol maximum", () => {
    expect(formatLimit(MAX_TRUST_LIMIT)).toBe("Maximum");
  });

  it("shows any other limit in the token unit", () => {
    expect(formatLimit(toBaseUnits("1000"))).toMatch(/^1,000\sRLUSD$/);
  });
});

describe("formatIssuerFee", () => {
  it.each([
    ["0", "en-US", "0%"],
    ["0.5", "en-US", "0.5%"],
    ["0.5", "fr-FR", "0,5 %"],
    ["0.0000001", "en-US", "0.0000001%"],
  ])("formats %s in %s as %s", (fee, locale, formatted) => {
    expect(formatIssuerFee(fee, locale)).toBe(formatted);
  });
});
