import { DerivationPathSchema } from "@domain/entity-derivation";
import { NetworkIdSchema } from "@domain/entity-network";
import { ETH_ADDR, SOL_ADDR, XPUB } from "./test-fixtures";

const TON_PUBKEY = "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060";
import { accountDescriptorKey } from "./key";
import { AccountKeySchema, type AccountDescriptor } from "./schema";

const utxo = (path: string, network = "bitcoin"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "utxo",
  network: NetworkIdSchema.parse(network),
  key: AccountKeySchema.parse(XPUB),
  path: DerivationPathSchema.parse(path),
});

const address = (addr: string, network = "ethereum"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network: NetworkIdSchema.parse(network),
  key: AccountKeySchema.parse(addr),
  path: DerivationPathSchema.parse("m/44h/60h/0h/0/0"),
});

const ton = (key: string): AccountDescriptor => ({
  ...address(key, "ton"),
  path: DerivationPathSchema.parse("m/44h/607h/0h/0h/0h/0h"),
});

describe("accountDescriptorKey", () => {
  it("collapses the hardened marker", () => {
    const key = accountDescriptorKey(utxo("m/84h/0h/0h"));
    expect(accountDescriptorKey(utxo("m/84'/0'/0'"))).toBe(key);
    expect(accountDescriptorKey(utxo("m/84H/0H/0H"))).toBe(key);
  });

  it("collapses the network case", () => {
    expect(accountDescriptorKey(utxo("m/84h/0h/0h", "Bitcoin"))).toBe(
      accountDescriptorKey(utxo("m/84h/0h/0h")),
    );
  });

  it("collapses EVM address case", () => {
    expect(accountDescriptorKey(address(ETH_ADDR.toLowerCase()))).toBe(
      accountDescriptorKey(address(ETH_ADDR)),
    );
  });

  it("keeps case-sensitive addresses distinct", () => {
    const solana = "solana";
    expect(accountDescriptorKey(address(SOL_ADDR, solana))).not.toBe(
      accountDescriptorKey(address(SOL_ADDR.toLowerCase(), solana)),
    );
  });

  it("collapses the case of a hex public key", () => {
    expect(accountDescriptorKey(ton(TON_PUBKEY.toUpperCase()))).toBe(
      accountDescriptorKey(ton(TON_PUBKEY)),
    );
  });

  it("separates different accounts", () => {
    expect(accountDescriptorKey(utxo("m/84h/0h/0h"))).not.toBe(
      accountDescriptorKey(utxo("m/84h/0h/1h")),
    );
  });

  it("separates a mock from the real account it mirrors", () => {
    expect(accountDescriptorKey({ ...utxo("m/84h/0h/0h"), purpose: "mock" })).not.toBe(
      accountDescriptorKey(utxo("m/84h/0h/0h")),
    );
  });
});

describe("persisted accountDescriptorKey", () => {
  it.each<[AccountDescriptor, string]>([
    [
      { ...address(ETH_ADDR, "Ethereum"), path: DerivationPathSchema.parse("m/44'/60'/0'/0/0") },
      `account:2:address:ethereum:${ETH_ADDR.toLowerCase()}:m/44h/60h/0h/0/0`,
    ],
    [
      { ...address(SOL_ADDR, "solana"), path: DerivationPathSchema.parse("m/44h/501h/0h/0h") },
      `account:2:address:solana:${SOL_ADDR}:m/44h/501h/0h/0h`,
    ],
    [{ ...utxo("m/84h/0h/0h"), purpose: "mock" }, `mock:2:utxo:bitcoin:${XPUB}:m/84h/0h/0h`],
    [utxo("m/84H/1H/2H", "BITCOIN_TESTNET"), `account:2:utxo:bitcoin_testnet:${XPUB}:m/84h/1h/2h`],
  ])("keeps the persisted key of %j", (descriptor, key) => {
    expect(accountDescriptorKey(descriptor)).toBe(key);
  });
});
