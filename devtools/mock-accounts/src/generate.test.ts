import { AccountDescriptorSchema, UnknownNetworkError } from "@domain/entity-account-descriptor";
import { accountIndexOf, mockDescriptors } from "./generate";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

describe("mockDescriptors", () => {
  it.each(["bitcoin", "bitcoin_testnet", "ethereum", "polygon", "solana"])(
    "makes valid, stable mock descriptors on %s",
    network => {
      const descriptors = mockDescriptors(network, 2, []);
      for (const descriptor of descriptors) {
        expect(AccountDescriptorSchema.parse(descriptor)).toEqual(descriptor);
        expect(descriptor).toMatchObject({ purpose: "mock", network });
      }
      expect(mockDescriptors(network, 2, [])).toEqual(descriptors);
      expect(descriptors[0]).not.toEqual(descriptors[1]);
    },
  );

  it("makes utxo accounts, native segwit on bitcoin", () => {
    const [main] = mockDescriptors("bitcoin", 1, []);
    const [test] = mockDescriptors("bitcoin_testnet", 1, []);
    expect(main).toMatchObject({ type: "utxo", path: "m/84h/0h/0h" });
    expect(main.type === "utxo" && main.xpub).toMatch(/^xpub[1-9A-HJ-NP-Za-km-z]{107}$/);
    expect(test).toMatchObject({ type: "utxo", path: "m/84h/1h/0h" });
    expect(test.type === "utxo" && test.xpub).toMatch(/^tpub/);
    expect(mockDescriptors("dogecoin", 1, [])[0]).toMatchObject({
      type: "utxo",
      path: "m/44h/3h/0h",
    });
  });

  it("makes xpubs whose public key lifts to a secp256k1 point", () => {
    const P = 2n ** 256n - 2n ** 32n - 977n;
    const pow = (base: bigint, exponent: bigint): bigint =>
      exponent === 0n
        ? 1n
        : (pow((base * base) % P, exponent >> 1n) * (exponent & 1n ? base : 1n)) % P;
    for (const descriptor of mockDescriptors("bitcoin", 20, [])) {
      if (descriptor.type !== "utxo") throw new Error("expected a utxo descriptor");
      const payload = [...descriptor.xpub].reduce(
        (acc, char) => acc * 58n + BigInt(BASE58.indexOf(char)),
        0n,
      );
      const key = (payload >> 32n) & (2n ** 264n - 1n);
      expect([2n, 3n]).toContain(key >> 256n);
      const x = key & (2n ** 256n - 1n);
      const ySquared = (x ** 3n + 7n) % P;
      const y = pow(ySquared, (P + 1n) / 4n);
      expect((y * y) % P).toBe(ySquared);
    }
  });

  it("makes checksummed address accounts on evm networks", () => {
    const [account] = mockDescriptors("ethereum", 1, []);
    expect(account).toMatchObject({ type: "address", path: "m/44h/60h/0h/0/0" });
    expect(account.type === "address" && account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("numbers after the highest mock of the same network", () => {
    const ethereum = mockDescriptors("ethereum", 2, []);
    const bitcoin = mockDescriptors("bitcoin", 1, []);
    expect(mockDescriptors("ethereum", 2, [...ethereum, ...bitcoin]).map(accountIndexOf)).toEqual([
      2, 3,
    ]);
    expect(mockDescriptors("bitcoin", 1, ethereum).map(accountIndexOf)).toEqual([0]);
  });

  it("rejects an unknown network", () => {
    expect(() => mockDescriptors("nope", 1, [])).toThrow(UnknownNetworkError);
  });
});
