import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { encodeAddress, randomAsU8a } from "@polkadot/util-crypto";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { polkadotDefaults } from "../config";
import { createMockPolkadotContext } from "../test/config.fixture";
import type { PolkadotSigner } from "../types";
import { createBridges } from "./index";

const SEED_PATH = "44'/354'/0'";
const USED_ADDRESS = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const UNUSED_ADDRESS = encodeAddress(randomAsU8a(32), 0);
const SEED_PUBLIC_KEY = "3a521fa830998568da9c205c987dcd157a78b2bd30ece3d1b6c32213986864ca";

const addresses: Record<string, string> = {
  [SEED_PATH]: USED_ADDRESS,
  "44'/354'/0'/0'/0'": USED_ADDRESS,
  "44'/354'/1'/0'/0'": UNUSED_ADDRESS,
};

const isValidAmount = (amount: BigNumber): boolean =>
  BigNumber.isBigNumber(amount) && !amount.isNaN();

const scan = async (): Promise<Account[]> => {
  const signer: PolkadotSigner = {
    getAddress: async (path: string) => {
      const address = addresses[path];
      if (!address) throw new Error(`unexpected derivation path ${path}`);
      return { address, pubKey: SEED_PUBLIC_KEY, return_code: 0x9000 };
    },
    sign: async () => ({ signature: null, return_code: 0x9000 }),
  };
  const signerContext: SignerContext<PolkadotSigner> = (_deviceId, fn) => fn(signer);

  const events = await lastValueFrom(
    createBridges(signerContext, createMockPolkadotContext(polkadotDefaults.assethub_polkadot))
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("assethub_polkadot"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account);
};

describe("Polkadot currency bridge scanAccounts (integration)", () => {
  let accounts: Account[];

  beforeAll(async () => {
    accounts = await scan();
  }, 240_000);

  it("discovers a used account followed by an unused account", () => {
    expect(accounts.map(account => [account.index, account.used])).toEqual([
      [0, true],
      [1, false],
    ]);
  });

  it("derives the identifiers of every account from the seed and the polkadot derivation", () => {
    expect(
      accounts.map(account => ({
        id: account.id,
        seedIdentifier: account.seedIdentifier,
        freshAddress: account.freshAddress,
        freshAddressPath: account.freshAddressPath,
        derivationMode: account.derivationMode,
      })),
    ).toEqual([
      {
        id: `js:2:assethub_polkadot:${USED_ADDRESS}:polkadotbip44`,
        seedIdentifier: SEED_PUBLIC_KEY,
        freshAddress: USED_ADDRESS,
        freshAddressPath: "44'/354'/0'/0'/0'",
        derivationMode: "polkadotbip44",
      },
      {
        id: `js:2:assethub_polkadot:${UNUSED_ADDRESS}:polkadotbip44`,
        seedIdentifier: SEED_PUBLIC_KEY,
        freshAddress: UNUSED_ADDRESS,
        freshAddressPath: "44'/354'/1'/0'/0'",
        derivationMode: "polkadotbip44",
      },
    ]);
  });

  it("reads valid balances for every account", () => {
    expect(accounts.every(account => isValidAmount(account.balance))).toBe(true);
  });

  it("reads the polkadot resources of every account", () => {
    expect(accounts).toEqual([
      expect.objectContaining({
        polkadotResources: expect.objectContaining({
          lockedBalance: expect.any(BigNumber),
          unlockedBalance: expect.any(BigNumber),
          unlockingBalance: expect.any(BigNumber),
          nonce: expect.any(Number),
        }),
      }),
      expect.objectContaining({
        polkadotResources: expect.objectContaining({
          lockedBalance: expect.any(BigNumber),
          unlockedBalance: expect.any(BigNumber),
          unlockingBalance: expect.any(BigNumber),
          nonce: expect.any(Number),
        }),
      }),
    ]);
  });

  it("reads the operation history of the used account", () => {
    expect(accounts[0].operationsCount).toBeGreaterThan(0);
  });

  it("reads no operation for the unused account", () => {
    expect(accounts[1].operations).toEqual([]);
  });
});
