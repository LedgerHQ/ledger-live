import type { Account } from "@ledgerhq/types-live";
import { accountDescriptorOf } from "./accountDescriptorOf";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";
const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const SOL_ADDR = "8Qs1nzggCjEYhFcj4yHwiS5s3QzNeCPWpQnntFdwUYhN";
const SOL_PUBLIC_KEY = "5gaQapKG9MpAWMLtZFoDqzmKfxMN2FXDVNAKiGFaMXGg";

const account = (over: Partial<Account> = {}): Account =>
  ({
    id: `js:2:ethereum:${ETH_ADDR}:ethM`,
    seedIdentifier: ETH_ADDR,
    derivationMode: "ethM",
    index: 0,
    currency: { id: "ethereum" },
    ...over,
  }) as Account;

describe("accountDescriptorOf", () => {
  it("describes an address-based account by its address and path", () => {
    expect(accountDescriptorOf(account())).toEqual({
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "ethereum", env: "main" },
      address: ETH_ADDR,
      path: "m/44h/60h/0h/0",
    });
  });

  it("describes a UTXO account by its xpub and hardened path", () => {
    expect(
      accountDescriptorOf(
        account({
          id: `js:2:bitcoin:${XPUB}:native_segwit`,
          seedIdentifier: XPUB,
          derivationMode: "native_segwit",
          index: 1,
          currency: { id: "bitcoin" } as Account["currency"],
        }),
      ),
    ).toEqual({
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/84h/0h/1h",
    });
  });

  it("keys the account by the address in its id, not by the device public key in seedIdentifier", () => {
    const descriptor = accountDescriptorOf(
      account({
        id: `js:2:solana:${SOL_ADDR}:solanaSub`,
        seedIdentifier: SOL_PUBLIC_KEY,
        derivationMode: "solanaSub",
        currency: { id: "solana" } as Account["currency"],
      }),
    );
    expect(descriptor.type === "address" && descriptor.address).toBe(SOL_ADDR);
  });
});
