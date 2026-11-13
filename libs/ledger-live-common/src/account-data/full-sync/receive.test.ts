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
import {
  ReceiveAddressUnknownError,
  ReceivePathUnknownError,
} from "@domain/entity-account-receive";
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

  it("rejects a fresh address path that is not a BIP32 path rather than leave it unverified", () => {
    expect(() =>
      defaultAccountReceive(accountOf("ethereum", { freshAddressPath: "nope" })),
    ).toThrow(ReceivePathUnknownError);
  });

  it("rejects an account without a fresh address path", () => {
    expect(() => defaultAccountReceive(accountOf("ethereum", { freshAddressPath: "" }))).toThrow(
      ReceivePathUnknownError,
    );
  });

  it("rejects an account without a fresh address", () => {
    expect(() => defaultAccountReceive(accountOf("ethereum", { freshAddress: "" }))).toThrow(
      ReceiveAddressUnknownError,
    );
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
      memo: { type: "text" },
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
      memo: { type: "text" },
    });
  });

  it("tells the senders of a coin whose transfers carry a tag to attach one", async () => {
    await expect(toAccountReceive(accountOf("ripple"))).resolves.toMatchObject({
      memo: { type: "tag" },
    });
  });

  it.each(["ethereum", "bitcoin"])("tells no memo for %s, whose transfers carry none", async id => {
    await expect(toAccountReceive(accountOf(id))).resolves.not.toHaveProperty("memo");
  });

  it("tells no memo for a family without a send descriptor", async () => {
    await expect(toAccountReceive(concordium(true))).resolves.not.toHaveProperty("memo");
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

// A unified address with an Orchard receiver (coin-zcash test fixture): a memo can ride to it.
const ORCHARD_ADDRESS =
  "utest1hap277en6ayclu5027232d44kv0s6nd0tacmnj07v0avarpuv4vzyfjreu3qexw05v9jvpx8ce37lpt5j4qexyrwhrlrma9msypee8x4";

describe("toAccountReceive on Zcash", () => {
  const transparent = {
    address: "t1transparent",
    verification: { type: "address", path: "m/44h/133h/0h/0/3", address: "t1transparent" },
  };

  afterEach(() => setZcashShieldedEnabled(false));

  it("adds the shielded address while the shielded engine runs, with the memo it alone carries", async () => {
    setZcashShieldedEnabled(true);
    await expect(toAccountReceive(zcash(ORCHARD_ADDRESS))).resolves.toEqual({
      ...transparent,
      shielded: {
        address: ORCHARD_ADDRESS,
        verification: { type: "shieldedAddress", path: "m/32h/133h/0h", address: ORCHARD_ADDRESS },
        memo: { type: "text" },
      },
    });
  });

  it("receives on the transparent address alone before the shielded address is derived", async () => {
    setZcashShieldedEnabled(true);
    await expect(toAccountReceive(zcash(null))).resolves.toEqual(transparent);
  });

  it("refuses a shielded verification at a non-hardened account path", async () => {
    setZcashShieldedEnabled(true);
    const account = { ...zcash("u1shielded"), freshAddressPath: "44'/133'/0/0/3" };
    await expect(toAccountReceive(account)).rejects.toThrow(ReceivePathUnknownError);
  });

  it("receives on the transparent address alone while the shielded engine is off", async () => {
    await expect(toAccountReceive(zcash("u1shielded"))).resolves.toEqual(transparent);
  });
});
