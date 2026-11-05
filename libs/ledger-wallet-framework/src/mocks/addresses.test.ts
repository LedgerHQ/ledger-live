import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "../types";
import { genAccount } from "./account";
import { isEd25519CurvePoint } from "./helpers";

/**
 * The mock generator feeds accounts straight into the live sync of each coin
 * module, so the generated addresses must at least look like what those
 * families expect. Generating a bitcoin-like address for every family used to
 * make the sync of e.g. aleo / concordium / solana fail.
 */
const cases: Array<[string, RegExp]> = [
  ["bitcoin", /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/],
  ["ethereum", /^0x[0-9a-fA-F]{40}$/],
  ["optimism", /^0x[0-9a-fA-F]{40}$/],
  ["linea_sepolia", /^0x[0-9a-fA-F]{40}$/],
  ["blast_sepolia", /^0x[0-9a-fA-F]{40}$/],
  ["hypercore", /^0x[0-9a-fA-F]{40}$/],
  ["flare", /^0x[0-9a-fA-F]{40}$/],
  ["celo", /^0x[0-9a-fA-F]{40}$/],
  ["vechain", /^0x[0-9a-fA-F]{40}$/],
  ["sui", /^0x[0-9a-fA-F]{64}$/],
  ["ton", /^0:[0-9a-fA-F]{64}$/],
  ["filecoin", /^f1[a-z2-7]{39}$/],
  ["aleo", /^aleo1[a-z0-9]{58}$/],
  ["cosmos", /^cosmos1[a-z0-9]{38}$/],
  ["coreum", /^core1[a-z0-9]{38}$/],
  ["osmo", /^osmo1[a-z0-9]{38}$/],
  ["tron", /^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  ["cardano", /^addr1[a-z0-9]{50}$/],
  ["stellar", /^G[A-Z0-9]{55}$/],
  ["tezos", /^tz1[1-9A-HJ-NP-Za-km-z]{33}$/],
  ["solana", /^[1-9A-HJ-NP-Za-km-z]{43,44}$/],
  ["concordium", /^[1-9A-HJ-NP-Za-km-z]{25,44}$/],
  ["hedera", /^0\.0\.\d{7}$/],
  ["algorand", /^[A-Z2-7]{58}$/],
];

test.each(cases)("generates a plausible %s address", (id, expected) => {
  // The domain currency type is structurally close to the framework's but not identical, so
  // every sibling test bridges it the same way.
  const currency = getCryptoCurrencyById(id) as unknown as CryptoCurrency;
  const account = genAccount("demo-seed", { currency });
  expect(account.freshAddress).toMatch(expected);
});

/**
 * concordium's proxy decodes the mock xpub as a compressed ed25519 public key, little-endian like
 * RFC 8032, and answers 400 for anything that is not a point on the curve (~half of random strings).
 */
test("generates a valid ed25519 public key for concordium", () => {
  const currency = getCryptoCurrencyById("concordium") as unknown as CryptoCurrency;
  const littleEndian = (hex: string) => BigInt(`0x${hex.match(/../g)!.reverse().join("")}`);
  for (let i = 0; i < 25; i++) {
    const { xpub } = genAccount(`pubkey-seed-${i}`, { currency });
    expect(xpub).toMatch(/^[0-9A-F]{64}$/);
    expect(isEd25519CurvePoint(littleEndian(xpub!) & ((1n << 255n) - 1n))).toBe(true);
  }
});
