import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Operation } from "@ledgerhq/types-live";
import { xrpConfig } from "./config";
import {
  enabledXrpTokenStandards,
  hasPendingXrpTokenRemoval,
  heldXrpTokenIds,
  standardOf,
} from "./tokenHolding";

const ripple = getCryptoCurrencyById("ripple");

const xrpToken = (name: string, tokenType: string): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`ripple/${tokenType}/${name}`),
  parentCurrencyId: ripple.id,
  contractAddress: "rIssuer",
  tokenIdentifier: name,
  tokenType,
  name,
  ticker: name,
  units: [{ name, code: name, magnitude: 0 }],
});

const iou = xrpToken("rlusd", "iou");
const mpt = xrpToken("tmpt", "mpt");

describe("enabledXrpTokenStandards and standardOf", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(xrpConfig);
    LiveConfig.setProvider({
      getValueByKey: (key: string) =>
        key === "config_currency_ripple" ? { enabledTokenStandards: ["iou"] } : undefined,
    });
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });

  it("matches a token only when its standard is enabled", () => {
    const standards = enabledXrpTokenStandards("ripple");

    expect(standardOf(standards, iou)).toBe("iou");
    expect(standardOf(standards, mpt)).toBeUndefined();
  });
});

describe("heldXrpTokenIds", () => {
  it("keeps the token accounts that still have xrpResources", () => {
    const account = genAccount("xrp", { currency: ripple });
    const held = {
      ...genTokenAccount(0, account, iou),
      xrpResources: { isLocked: false, limit: new BigNumber(1000), isRippling: false },
    };
    const removed = genTokenAccount(1, account, mpt);

    expect(heldXrpTokenIds({ ...account, subAccounts: [held, removed] })).toEqual(
      new Set([iou.id]),
    );
  });
});

describe("hasPendingXrpTokenRemoval", () => {
  const account = genAccount("xrp", { currency: ripple });

  const iouAsset = { assetReference: iou.tokenIdentifier, assetOwner: iou.contractAddress };

  const removal: Operation = {
    id: "op-opt-out",
    hash: "",
    type: "OPT_OUT",
    value: new BigNumber(0),
    fee: new BigNumber(12),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: account.id,
    date: new Date(),
    extra: {},
    transactionRaw: { amount: "0", recipient: "", ...iouAsset },
  };

  function withPending(operation: Operation) {
    return { ...account, pendingOperations: [operation] };
  }

  it("finds a pending removal of the token", () => {
    expect(hasPendingXrpTokenRemoval(withPending(removal), iou)).toBe(true);
  });

  it("ignores a pending removal of another token", () => {
    expect(hasPendingXrpTokenRemoval(withPending(removal), mpt)).toBe(false);
  });

  it("ignores a pending operation that is not a removal", () => {
    expect(hasPendingXrpTokenRemoval(withPending({ ...removal, type: "OPT_IN" }), iou)).toBe(false);
  });
});
