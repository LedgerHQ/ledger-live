import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "./account";

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
  ["aleo", /^aleo1[a-z0-9]{58}$/],
  ["cosmos", /^cosmos1[a-z0-9]{38}$/],
  ["tron", /^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  ["cardano", /^addr1[a-z0-9]{50}$/],
  ["stellar", /^G[A-Z0-9]{55}$/],
  ["tezos", /^tz1[1-9A-HJ-NP-Za-km-z]{33}$/],
  ["solana", /^[1-9A-HJ-NP-Za-km-z]{26,44}$/],
  ["concordium", /^[1-9A-HJ-NP-Za-km-z]{25,44}$/],
];

test.each(cases)("generates a plausible %s address", (id, expected) => {
  const currency = getCryptoCurrencyById(id);
  const account = genAccount("demo-seed", { currency });
  expect(account.freshAddress).toMatch(expected);
});
