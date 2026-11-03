import { ETH_ADDR, SOL_ADDR, XPUB } from "./test-fixtures";
import { AccountUUIDSchema, accountDescriptorKey, computeAccountUUID } from "./key";
import { mockAddressAccountDescriptor } from "./schema.mock";
import type { AccountDescriptor } from "./schema";
import { NetworkIdSchema } from "./network";

const utxo = (path: string, network = "bitcoin"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "utxo",
  network: NetworkIdSchema.parse(network),
  xpub: XPUB,
  path,
});

const address = (addr: string, network = "ethereum"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network: NetworkIdSchema.parse(network),
  address: addr,
  path: "m/44h/60h/0h/0/0",
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

describe("computeAccountUUID", () => {
  it("is stable for a known descriptor", () => {
    expect(computeAccountUUID(utxo("m/84h/0h/0h"))).toBe("0fd543d7-5125-5f32-95c7-937d6a169ed4");
  });

  it.each<[AccountDescriptor, string, string]>([
    [
      { ...address(ETH_ADDR, "Ethereum"), path: "m/44'/60'/0'/0/0" },
      `account:2:address:ethereum:${ETH_ADDR.toLowerCase()}:m/44h/60h/0h/0/0`,
      "bf498ad6-dbff-5da0-834d-8f3870db2426",
    ],
    [
      { ...address(SOL_ADDR, "solana"), path: "m/44h/501h/0h/0h" },
      `account:2:address:solana:${SOL_ADDR}:m/44h/501h/0h/0h`,
      "900a3c3b-f896-5151-968e-8bdf9748d2eb",
    ],
    [
      { ...utxo("m/84h/0h/0h"), purpose: "mock" },
      `mock:2:utxo:bitcoin:${XPUB}:m/84h/0h/0h`,
      "ebb5087d-2b3d-5e15-9cfe-0d5a6f2d1aec",
    ],
    [
      utxo("m/84H/1H/2H", "BITCOIN_TESTNET"),
      `account:2:utxo:bitcoin_testnet:${XPUB}:m/84h/1h/2h`,
      "70635ea8-643f-5857-ae57-bba062f6f694",
    ],
  ])("keeps the persisted key and uuid of %j", (descriptor, key, uuid) => {
    expect(accountDescriptorKey(descriptor)).toBe(key);
    expect(computeAccountUUID(descriptor)).toBe(uuid);
  });

  it("carries neither xpub nor address", () => {
    expect(computeAccountUUID(address(ETH_ADDR))).not.toContain(
      ETH_ADDR.slice(2, 10).toLowerCase(),
    );
  });
});

describe("AccountUUIDSchema", () => {
  it("accepts a computed uuid and rejects a v4 uuid", () => {
    expect(
      AccountUUIDSchema.safeParse(computeAccountUUID(mockAddressAccountDescriptor())).success,
    ).toBe(true);
    expect(AccountUUIDSchema.safeParse("9b2f6d0e-3c4a-4d6b-8e1f-0a1b2c3d4e5f").success).toBe(false);
  });
});
