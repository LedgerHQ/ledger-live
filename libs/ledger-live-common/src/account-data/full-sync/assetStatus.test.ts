import type { Account } from "@ledgerhq/types-live";
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { genAccount } from "../../mock/account";
import { fromLegacyAccount } from "../../account/accountDescriptor";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { xrpConfig } from "../../families/xrp/config";
import { FullSyncAssetNotOnAccountError, FullSyncQueryRequiredError } from "./errors";
import { toAssetStatus } from "./assetStatus";

registerAllCoins();

const accountOf = (currencyId: string, fields: Partial<Account> = {}): Account => ({
  ...genAccount(currencyId, { currency: getCryptoCurrencyById("ethereum") }),
  currency: getCryptoCurrencyById(currencyId),
  subAccounts: [],
  ...fields,
});

const tokenOf = (id: string, parentCurrencyId: string, tokenType: string): TokenCurrency =>
  mockTokenCurrency({
    id: TokenCurrencyIdSchema.parse(id),
    parentCurrencyId: CryptoCurrencyIdSchema.parse(parentCurrencyId),
    tokenType,
  });

const usdt = tokenOf("ethereum/erc20/usd_tether__erc20_", "ethereum", "erc20");
const hts = tokenOf("hedera/hts/usdc_0.0.456858", "hedera", "hts");
const asa = tokenOf("algorand/asa/31566704", "algorand", "asa");
const stellarUsdc = tokenOf("stellar/asset/usdc:ga5z", "stellar", "stellar");
const rlusd = tokenOf("ripple/iou/rlusd", "ripple", "iou");
const mpt = tokenOf("ripple/mpt/00a1", "ripple", "mpt");
const cantonToken = tokenOf("canton_network/token/usdcx", "canton_network", "canton");
const unprefixed = tokenOf("usdt_on_ethereum", "ethereum", "erc20");
const prefixedElsewhere = tokenOf("ethereum/erc20/usdt", "ethereum_classic", "erc20");
const tokens = [
  usdt,
  hts,
  asa,
  stellarUsdc,
  rlusd,
  mpt,
  cantonToken,
  unprefixed,
  prefixedElsewhere,
];

const findTokenById = jest.fn(async (id: string) => tokens.find(token => token.id === id));

setCryptoAssetsStore({
  findTokenById,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

beforeEach(() => findTokenById.mockClear());

const holding = (account: Account, token: TokenCurrency, fields: object = {}): Account => ({
  ...account,
  subAccounts: [{ ...genTokenAccount(0, account, token), balance: new BigNumber(1), ...fields }],
});

const zero = { balance: new BigNumber(0) };

const sync = jest.fn(async (_target: unknown) => accountOf("ethereum"));

beforeEach(() => sync.mockClear());

/** Reads the asset of the account, the full sync answering the account itself. */
const read = (account: Account, query: Parameters<typeof toAssetStatus>[1]) => {
  const descriptor = fromLegacyAccount(account);
  sync.mockImplementation(async () => account);
  return toAssetStatus({ accountUUID: computeAccountUUID(descriptor), descriptor }, query, sync);
};

const assetGateOf = async (account: Account, token: TokenCurrency) =>
  (await read(account, { assetId: token.id })).status.assetGate;

describe("toAssetStatus", () => {
  it("needs no activation for the native coin, without a lookup nor a sync", async () => {
    const assetId = CryptoOrTokenCurrencyIdSchema.parse("hedera");
    await expect(read(accountOf("hedera"), { assetId })).resolves.toEqual({
      assetId,
      status: { assetGate: null },
    });
    expect(findTokenById).not.toHaveBeenCalled();
    expect(sync).not.toHaveBeenCalled();
  });

  it("needs no activation on a network without one, without a sync", async () => {
    await expect(read(accountOf("ethereum"), { assetId: usdt.id })).resolves.toEqual({
      assetId: usdt.id,
      status: { assetGate: null },
    });
    expect(sync).not.toHaveBeenCalled();
  });

  it("syncs the account of a family with activation", async () => {
    await assetGateOf(accountOf("hedera"), hts);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("requires the association of an HTS token the Hedera account does not hold", async () => {
    await expect(assetGateOf(accountOf("hedera"), hts)).resolves.toEqual({
      type: "activation",
      method: "association",
    });
    await expect(assetGateOf(holding(accountOf("hedera"), hts), hts)).resolves.toBeNull();
  });

  it("needs no association while the Hedera account associates tokens automatically", async () => {
    const hedera: HederaAccount = {
      ...accountOf("hedera"),
      hederaResources: {
        maxAutomaticTokenAssociations: -1,
        isAutoTokenAssociationEnabled: true,
        delegation: null,
      },
    };
    await expect(assetGateOf(hedera, hts)).resolves.toBeNull();
  });

  it("requires the opt-in of an ASA the Algorand account does not hold", async () => {
    await expect(assetGateOf(accountOf("algorand"), asa)).resolves.toEqual({
      type: "activation",
      method: "optIn",
    });
    await expect(assetGateOf(holding(accountOf("algorand"), asa, zero), asa)).resolves.toBeNull();
  });

  it("requires a trustline for a Stellar asset the account does not hold", async () => {
    await expect(assetGateOf(accountOf("stellar"), stellarUsdc)).resolves.toEqual({
      type: "activation",
      method: "trustline",
    });
    await expect(
      assetGateOf(holding(accountOf("stellar"), stellarUsdc), stellarUsdc),
    ).resolves.toBeNull();
  });

  it("needs no activation for a token of a family without one", async () => {
    await expect(read(accountOf("canton_network"), { assetId: cantonToken.id })).resolves.toEqual({
      assetId: cantonToken.id,
      status: { assetGate: null },
    });
  });

  it("rejects a token of another network", async () => {
    await expect(read(accountOf("hedera"), { assetId: usdt.id })).rejects.toThrow(
      FullSyncAssetNotOnAccountError,
    );
  });

  it("tells the network of a token from the store, not from its opaque id", async () => {
    await expect(read(accountOf("ethereum"), { assetId: unprefixed.id })).resolves.toEqual({
      assetId: unprefixed.id,
      status: { assetGate: null },
    });
    await expect(read(accountOf("ethereum"), { assetId: prefixedElsewhere.id })).rejects.toThrow(
      FullSyncAssetNotOnAccountError,
    );
  });

  it.each(["hedera", "ethereum"])(
    "rejects a token of the %s network that the store does not know, without a sync",
    async currencyId => {
      await expect(
        read(accountOf(currencyId), {
          assetId: TokenCurrencyIdSchema.parse(`${currencyId}/token/nope`),
        }),
      ).rejects.toThrow(FullSyncAssetNotOnAccountError);
      expect(sync).not.toHaveBeenCalled();
    },
  );

  it("rejects a read that names no asset, without a sync", async () => {
    await expect(read(accountOf("ethereum"), undefined)).rejects.toThrow(
      FullSyncQueryRequiredError,
    );
    expect(sync).not.toHaveBeenCalled();
  });

  it("rejects an unknown asset", async () => {
    await expect(
      read(accountOf("ethereum"), { assetId: TokenCurrencyIdSchema.parse("nope") }),
    ).rejects.toThrow(FullSyncAssetNotOnAccountError);
  });
});

describe("toAssetStatus of an XRP token", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(xrpConfig);
    LiveConfig.setProvider({
      getValueByKey: (key: string) =>
        key === "config_currency_ripple" ? { enabledTokenStandards: ["iou", "mpt"] } : undefined,
    });
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });

  it("requires a trust line for an IOU whose token account has no xrpResources", async () => {
    await expect(assetGateOf(holding(accountOf("ripple"), rlusd), rlusd)).resolves.toEqual({
      type: "activation",
      method: "trustline",
    });
    await expect(
      assetGateOf(
        holding(accountOf("ripple"), rlusd, { ...zero, xrpResources: { isLocked: false } }),
        rlusd,
      ),
    ).resolves.toBeNull();
  });

  it("requires the authorization of an MPT whose token account has no xrpResources", async () => {
    await expect(assetGateOf(accountOf("ripple"), mpt)).resolves.toEqual({
      type: "activation",
      method: "authorize",
    });
    await expect(
      assetGateOf(holding(accountOf("ripple"), mpt, { xrpResources: { isLocked: false } }), mpt),
    ).resolves.toBeNull();
  });

  it("cannot tell the activation of a token whose standard sync does not read", async () => {
    LiveConfig.instance.provider = undefined;
    await expect(assetGateOf(accountOf("ripple"), rlusd)).resolves.toEqual({ type: "unknown" });
  });
});
