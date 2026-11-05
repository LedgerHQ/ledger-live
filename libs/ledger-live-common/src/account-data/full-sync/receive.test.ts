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
import { ReceiveAddressUnknownError } from "@domain/entity-account-receive";
import { toAccountReceive } from "./receive";

registerAllCoins();

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
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    });
  });

  it("leaves the verification out when the account has no fresh address path", () => {
    expect(defaultAccountReceive(accountOf("ethereum", { freshAddressPath: "" }))).toEqual({
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    });
  });
});

describe("toAccountReceive", () => {
  it("uses the default rule for a family without its own", async () => {
    await expect(toAccountReceive(accountOf("ethereum"))).resolves.toEqual(
      defaultAccountReceive(accountOf("ethereum")),
    );
  });

  it("receives a Canton account on its party id, the device showing the address of its key", async () => {
    await expect(toAccountReceive(canton(true, "ldg::1220ab"))).resolves.toEqual({
      address: "ldg::1220ab",
      verification: { type: "address", path: "m/44h/6767h/0h/0h/0h", address: "canton_9f3c" },
    });
  });

  it("receives a Canton account on its party id while its onboarding is pending", async () => {
    await expect(toAccountReceive(canton(false, "ldg::1220ab"))).resolves.toMatchObject({
      address: "ldg::1220ab",
    });
  });

  it("rejects a Canton account without a party id", async () => {
    await expect(toAccountReceive(canton(false))).rejects.toThrow(ReceiveAddressUnknownError);
  });

  it("receives an onboarded Concordium account on its on-chain address, which the device confirms", async () => {
    await expect(toAccountReceive(concordium(true))).resolves.toEqual({
      address: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
      verification: {
        type: "addressConfirmation",
        path: "m/44h/60h/0h/0/0",
        address: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
      },
    });
  });

  it("rejects a Concordium account before its credential gives it an on-chain address", async () => {
    await expect(toAccountReceive(concordium(false))).rejects.toThrow(ReceiveAddressUnknownError);
  });

  it("leaves the verification of a Hedera account without its key out", async () => {
    const hedera: HederaAccount = accountOf("hedera", {
      freshAddress: "0.0.1234",
      seedIdentifier: "",
    });
    await expect(toAccountReceive(hedera)).resolves.toEqual({
      address: "0.0.1234",
    });
  });

  it("verifies a Hedera account by the key that controls it", async () => {
    const hedera: HederaAccount = accountOf("hedera", {
      freshAddress: "0.0.1234",
      freshAddressPath: "44'/3030'/0'/0'/0'",
      seedIdentifier: "302a",
    });
    await expect(toAccountReceive(hedera)).resolves.toEqual({
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
    address: "t1transparent",
    verification: { type: "address", path: "m/44h/133h/0h/0/3", address: "t1transparent" },
  };

  afterEach(() => setZcashShieldedEnabled(false));

  it("adds the shielded address while the shielded engine runs", async () => {
    setZcashShieldedEnabled(true);
    await expect(toAccountReceive(zcash("u1shielded"))).resolves.toEqual({
      ...transparent,
      shielded: {
        address: "u1shielded",
        verification: { type: "address", path: "m/32h/133h/0h", address: "u1shielded" },
      },
    });
  });

  it("receives on the transparent address alone before the shielded address is derived", async () => {
    setZcashShieldedEnabled(true);
    await expect(toAccountReceive(zcash(null))).resolves.toEqual(transparent);
  });

  it("receives on the transparent address alone while the shielded engine is off", async () => {
    await expect(toAccountReceive(zcash("u1shielded"))).resolves.toEqual(transparent);
  });
});
