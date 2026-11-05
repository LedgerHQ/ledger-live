import type { Account } from "@ledgerhq/types-live";
import type { CantonAccount } from "@ledgerhq/coin-canton/types";
import type { ConcordiumAccount } from "@ledgerhq/coin-concordium/types";
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { setZcashShieldedEnabled } from "../../bridge/zcashRouting";
import { defaultAccountReceive } from "../../account/accountReceive";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { FullSyncAssetNotOnAccountError } from "./errors";
import { toAccountReceive } from "./receive";

registerAllCoins();

const receiveOf = async (account: Account) => (await toAccountReceive(account)).receive;

const accountOf = (currencyId: string, fields: Partial<Account> = {}): Account => ({
  ...genAccount(currencyId, { currency: getCryptoCurrencyById("ethereum") }),
  currency: getCryptoCurrencyById(currencyId),
  freshAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  freshAddressPath: "44'/60'/0'/0/0",
  ...fields,
});

const canton = (isOnboarded: boolean, xpub?: string): CantonAccount => ({
  ...accountOf("canton_network", {
    freshAddress: "canton_9f3c",
    freshAddressPath: "44'/6767'/0'/0'/0'",
    xpub,
  }),
  cantonResources: { isOnboarded, instrumentUtxoCounts: {}, pendingTransferProposals: [] },
});

const concordium = (isOnboarded: boolean): ConcordiumAccount => ({
  ...accountOf("concordium", {
    freshAddress: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
  }),
  concordiumResources: {
    isOnboarded,
    credId: "c",
    publicKey: "p",
    identityIndex: 0,
    credNumber: 0,
    ipIdentity: 0,
  },
});

describe("defaultAccountReceive", () => {
  it("receives on the fresh address, which the device shows at the fresh address path", () => {
    expect(defaultAccountReceive(accountOf("ethereum"))).toEqual({
      status: "ready",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      verification: {
        type: "address",
        path: "m/44h/60h/0h/0/0",
        address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      },
    });
  });

  it("reads a fresh address path already prefixed by m/", () => {
    expect(
      defaultAccountReceive(accountOf("ethereum", { freshAddressPath: "m/44'/60'/0'/0/0" })),
    ).toMatchObject({
      verification: { path: "m/44h/60h/0h/0/0" },
    });
  });

  it("leaves the verification out when the fresh address path is not a BIP32 path", () => {
    expect(defaultAccountReceive(accountOf("ethereum", { freshAddressPath: "nope" }))).toEqual({
      status: "ready",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    });
  });

  it("leaves the verification out when the account has no fresh address path", () => {
    expect(defaultAccountReceive(accountOf("ethereum", { freshAddressPath: "" }))).toEqual({
      status: "ready",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    });
  });
});

describe("toAccountReceive", () => {
  it("uses the default rule for a family without its own", async () => {
    await expect(receiveOf(accountOf("ethereum"))).resolves.toEqual(
      defaultAccountReceive(accountOf("ethereum")),
    );
  });

  it("receives a Canton account on its party id, the device showing the address of its key", async () => {
    await expect(receiveOf(canton(true, "ldg::1220ab"))).resolves.toEqual({
      status: "ready",
      address: "ldg::1220ab",
      verification: { type: "address", path: "m/44h/6767h/0h/0h/0h", address: "canton_9f3c" },
    });
  });

  it("requires the onboarding of a Canton account without a party id", async () => {
    await expect(receiveOf(canton(false))).resolves.toEqual({
      status: "onboardingRequired",
    });
  });

  it("receives an onboarded Concordium account on its on-chain address, which the device confirms", async () => {
    await expect(receiveOf(concordium(true))).resolves.toEqual({
      status: "ready",
      address: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
      verification: {
        type: "addressConfirmation",
        path: "m/44h/60h/0h/0/0",
        address: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
      },
    });
  });

  it("requires the onboarding of a Concordium account", async () => {
    await expect(receiveOf(concordium(false))).resolves.toEqual({
      status: "onboardingRequired",
    });
  });

  it("leaves the verification of a Hedera account without its key out", async () => {
    const hedera: HederaAccount = accountOf("hedera", {
      freshAddress: "0.0.1234",
      seedIdentifier: "",
    });
    await expect(receiveOf(hedera)).resolves.toEqual({
      status: "ready",
      address: "0.0.1234",
    });
  });

  it("verifies a Hedera account by the key that controls it", async () => {
    const hedera: HederaAccount = accountOf("hedera", {
      freshAddress: "0.0.1234",
      freshAddressPath: "44'/3030'/0'/0'/0'",
      seedIdentifier: "302a",
    });
    await expect(receiveOf(hedera)).resolves.toEqual({
      status: "ready",
      address: "0.0.1234",
      verification: { type: "publicKey", path: "m/44h/3030h/0h/0h/0h", publicKey: "302a" },
    });
  });
});

const zcash = (shieldedAddress: string | null): ZcashAccount => ({
  ...accountOf("zcash", { freshAddress: "t1transparent", freshAddressPath: "44'/133'/0'/0/3" }),
  bitcoinResources: { utxos: [] },
  privateInfo: {
    saplingBalance: new BigNumber(0),
    orchardBalance: new BigNumber(0),
    ironwoodBalance: new BigNumber(0),
    syncState: "disabled",
    progress: 0,
    estimatedTimeRemaining: { hours: 0, minutes: 0 },
    ufvk: null,
    birthday: null,
    shieldedAddress,
    lastSyncTimestamp: null,
    lastProcessedBlock: null,
    transactions: [],
  },
});

describe("toAccountReceive on Zcash", () => {
  const transparent = {
    status: "ready",
    address: "t1transparent",
    verification: { type: "address", path: "m/44h/133h/0h/0/3", address: "t1transparent" },
  };

  afterEach(() => setZcashShieldedEnabled(false));

  it("adds the shielded address while the shielded engine runs", async () => {
    setZcashShieldedEnabled(true);
    await expect(receiveOf(zcash("u1shielded"))).resolves.toEqual({
      ...transparent,
      shielded: {
        address: "u1shielded",
        verification: { type: "address", path: "m/32h/133h/0h", address: "u1shielded" },
      },
    });
  });

  it("receives on the transparent address alone before the shielded address is derived", async () => {
    setZcashShieldedEnabled(true);
    await expect(receiveOf(zcash(null))).resolves.toEqual(transparent);
  });

  it("receives on the transparent address alone while the shielded engine is off", async () => {
    await expect(receiveOf(zcash("u1shielded"))).resolves.toEqual(transparent);
  });
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
const cantonToken = tokenOf("canton_network/token/usdcx", "canton_network", "canton");
const tokens = [usdt, hts, asa, stellarUsdc, rlusd, cantonToken];

setCryptoAssetsStore({
  findTokenById: async id => tokens.find(token => token.id === id),
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const holding = (account: Account, token: TokenCurrency, fields: object = {}): Account => ({
  ...account,
  subAccounts: [{ ...genTokenAccount(0, account, token), ...fields }],
});

const receiveAsset = (account: Account, token: TokenCurrency) =>
  toAccountReceive(account, { assetId: token.id });

describe("toAccountReceive of an asset", () => {
  it("names the native coin when the query names no asset", async () => {
    await expect(toAccountReceive(accountOf("ethereum"))).resolves.toMatchObject({
      assetId: "ethereum",
    });
  });

  it("receives a token on the address of its account when its network needs no activation", async () => {
    await expect(receiveAsset(accountOf("ethereum"), usdt)).resolves.toEqual({
      assetId: usdt.id,
      receive: defaultAccountReceive(accountOf("ethereum")),
    });
  });

  it("requires the association of an HTS token the Hedera account does not hold", async () => {
    await expect(receiveAsset(accountOf("hedera"), hts)).resolves.toEqual({
      assetId: hts.id,
      receive: { status: "assetActivationRequired" },
    });
  });

  it("receives an HTS token the Hedera account holds", async () => {
    await expect(receiveAsset(holding(accountOf("hedera"), hts), hts)).resolves.toMatchObject({
      receive: { status: "ready" },
    });
  });

  it("receives any HTS token while the Hedera account associates tokens automatically", async () => {
    const hedera: HederaAccount = {
      ...accountOf("hedera"),
      hederaResources: {
        maxAutomaticTokenAssociations: -1,
        isAutoTokenAssociationEnabled: true,
        delegation: null,
      },
    };
    await expect(receiveAsset(hedera, hts)).resolves.toMatchObject({
      receive: { status: "ready" },
    });
  });

  it("receives a token the user hid, whose activation sync no longer tells", async () => {
    await expect(
      toAccountReceive(accountOf("algorand"), { assetId: asa.id }, [asa.id]),
    ).resolves.toMatchObject({ receive: { status: "ready" } });
  });

  it("requires the opt-in of an ASA the Algorand account does not hold", async () => {
    await expect(receiveAsset(accountOf("algorand"), asa)).resolves.toMatchObject({
      receive: { status: "assetActivationRequired" },
    });
    await expect(receiveAsset(holding(accountOf("algorand"), asa), asa)).resolves.toMatchObject({
      receive: { status: "ready" },
    });
  });

  it("requires a trustline for a Stellar asset the account does not hold", async () => {
    await expect(receiveAsset(accountOf("stellar"), stellarUsdc)).resolves.toMatchObject({
      receive: { status: "assetActivationRequired" },
    });
    await expect(
      receiveAsset(holding(accountOf("stellar"), stellarUsdc), stellarUsdc),
    ).resolves.toMatchObject({ receive: { status: "ready" } });
  });

  it("requires a trust line for an XRP token whose account the sync did not find on chain", async () => {
    await expect(receiveAsset(holding(accountOf("ripple"), rlusd), rlusd)).resolves.toMatchObject({
      receive: { status: "assetActivationRequired" },
    });
    await expect(
      receiveAsset(
        holding(accountOf("ripple"), rlusd, { xrpResources: { isLocked: false } }),
        rlusd,
      ),
    ).resolves.toMatchObject({ receive: { status: "ready" } });
  });

  it("requires the onboarding of the account before any of its tokens", async () => {
    await expect(receiveAsset(canton(false), cantonToken)).resolves.toEqual({
      assetId: cantonToken.id,
      receive: { status: "onboardingRequired" },
    });
  });

  it("rejects a token of another network", async () => {
    await expect(receiveAsset(accountOf("hedera"), usdt)).rejects.toThrow(
      FullSyncAssetNotOnAccountError,
    );
  });

  it("rejects an unknown asset", async () => {
    await expect(
      toAccountReceive(accountOf("ethereum"), { assetId: TokenCurrencyIdSchema.parse("nope") }),
    ).rejects.toThrow(FullSyncAssetNotOnAccountError);
  });
});
