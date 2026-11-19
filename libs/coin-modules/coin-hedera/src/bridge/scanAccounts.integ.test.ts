import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { TokenCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { hederaDefaults } from "../config";
import { HARDCODED_BLOCK_HEIGHT } from "../constants";
import { rpcClient } from "../network/rpc";
import { getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import type { HederaAccount, HederaSigner } from "../types";
import { createBridges } from "./index";

const FUNDED_PUBLIC_KEY = "9e92a312233d5fd6b5a723875aeea2cea81a8e48ffc00341cff6dffcfd3ab7f2"; // gitleaks:allow
const FUNDED_ACCOUNT_ID = "0.0.1040977";

const tokensByAddress = new Map<string, TokenCurrency>();

const buildToken = (address: string): TokenCurrency => {
  const known = tokensByAddress.get(address);
  if (known) return known;

  const token = getMockedHTSTokenCurrency({
    id: TokenCurrencyIdSchema.parse(`hedera/hts/${address}`),
    contractAddress: address,
    name: address,
    ticker: address,
    units: [{ name: address, code: address, magnitude: 0 }],
  });
  tokensByAddress.set(address, token);

  return token;
};

const scan = async (): Promise<HederaAccount[]> => {
  const signer: HederaSigner = {
    getPublicKey: async () => FUNDED_PUBLIC_KEY,
    signTransaction: async () => new Uint8Array(),
  };
  const signerContext = ((_deviceId: string, fn: (signer: HederaSigner) => unknown) =>
    fn(signer)) as unknown as SignerContext<HederaSigner>;

  const events = await lastValueFrom(
    createBridges(signerContext, () => hederaDefaults.hedera)
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("hedera"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as HederaAccount);
};

describe("Hedera currency bridge scanAccounts (integration)", () => {
  let accounts: HederaAccount[];

  beforeAll(async () => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async address =>
        address.startsWith("0.0.") ? buildToken(address) : undefined,
      findTokenById: async id =>
        id.startsWith("hedera/hts/") ? buildToken(id.slice(11)) : undefined,
      getTokensSyncHash: async () => "stub-sync-hash",
    });
    accounts = await scan();
  }, 240_000);

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  it("discovers the accounts attached to the device public key", async () => {
    expect(accounts.map(account => account.freshAddress)).toContain(FUNDED_ACCOUNT_ID);
  });

  it("derives the id, derivation mode and path fields of the discovered accounts", async () => {
    const funded = accounts.find(account => account.freshAddress === FUNDED_ACCOUNT_ID);

    expect(funded).toMatchObject({
      id: `js:2:hedera:${FUNDED_ACCOUNT_ID}:hederaBip44`,
      derivationMode: "hederaBip44",
      seedIdentifier: FUNDED_PUBLIC_KEY,
      freshAddressPath: "44/3030",
      used: true,
      blockHeight: HARDCODED_BLOCK_HEIGHT,
    });
  });

  it("fills the balances and the hedera resources of the funded account", async () => {
    const funded = accounts.find(account => account.freshAddress === FUNDED_ACCOUNT_ID);

    expect({
      balanceIsAmount: BigNumber.isBigNumber(funded?.balance),
      spendableMatchesBalance: funded?.spendableBalance.eq(funded.balance),
      maxAutomaticTokenAssociations: typeof funded?.hederaResources?.maxAutomaticTokenAssociations,
      isAutoTokenAssociationEnabled: typeof funded?.hederaResources?.isAutoTokenAssociationEnabled,
    }).toEqual({
      balanceIsAmount: true,
      spendableMatchesBalance: true,
      maxAutomaticTokenAssociations: "number",
      isAutoTokenAssociationEnabled: "boolean",
    });
  });

  it("maps every fetched transaction to an operation with typed amounts and addresses", async () => {
    const funded = accounts.find(account => account.freshAddress === FUNDED_ACCOUNT_ID);

    const invalidOperations = (funded?.operations ?? []).filter(
      op =>
        !BigNumber.isBigNumber(op.value) ||
        !BigNumber.isBigNumber(op.fee) ||
        !op.hash ||
        typeof op.type !== "string" ||
        !(op.date instanceof Date),
    );

    expect({
      hasOperations:
        (funded?.operationsCount ?? 0) > 0 && funded?.operationsCount === funded?.operations.length,
      invalidOperations,
    }).toEqual({ hasOperations: true, invalidOperations: [] });
  });

  it("does not duplicate operations of the funded account", async () => {
    const funded = accounts.find(account => account.freshAddress === FUNDED_ACCOUNT_ID);

    const ids = (funded?.operations ?? []).map(op => op.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds token sub accounts attached to the funded account", async () => {
    const funded = accounts.find(account => account.freshAddress === FUNDED_ACCOUNT_ID);

    expect(funded?.subAccounts?.length).toBeGreaterThan(0);
    expect(funded?.subAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "TokenAccount",
          parentId: funded?.id,
          balance: expect.any(BigNumber),
        }),
      ]),
    );
  });
});
