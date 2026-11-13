import { from, switchMap } from "rxjs";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { candidateOf } from "@domain/entity-derivation";
import type { DerivationMode } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { cardanoScanAccounts } from "@ledgerhq/coin-cardano/datasets/scanAccounts";
import { cardanoRawAccount1 } from "@ledgerhq/coin-cardano/datasets/rawAccount.1";
import { dataset as kaspaDataset } from "@ledgerhq/coin-kaspa/test/index";
import type { RunOnTransport } from "../../coin-modules/types";
import { placeholderAccount } from "../full-sync/placeholderAccount";
import { deriveOnTransport } from "./deriveOnSession";

jest.mock("../../bridge/mockMode", () => ({ usesMockBridges: () => false }));

/** The `=>`/`<=` pairs of a recording. */
const exchangesOf = (apdus: string): string[][] => {
  const lines = apdus
    .trim()
    .split("\n")
    .map(line => line.trim());
  return lines.flatMap((line, i) => (i % 2 === 0 ? [[line, lines[i + 1]]] : []));
};

const replaying =
  (store: RecordStore): RunOnTransport =>
  job =>
    from(openTransportReplayer(store)).pipe(switchMap(job));

const responseOf = (exchange: string[]) => exchange[1].replace(/^<= /, "").replace(/9000$/, "");

async function accountIdDiscovered(
  currencyId: string,
  mode: DerivationMode,
  index: number,
  exchanges: string[][],
) {
  const currency = getCryptoCurrencyById(currencyId);
  const store = RecordStore.fromString(exchanges.flat().join("\n"));
  const derived = await deriveOnTransport(replaying(store))(
    candidateOf(currency, mode, index),
    new AbortController().signal,
  );
  store.ensureQueueEmpty();
  if (!derived) throw new Error("no descriptor");
  const descriptor = "descriptor" in derived ? derived.descriptor : derived;
  return (await placeholderAccount(descriptor)).id;
}

/** Each account replays exactly the exchanges the legacy scan recorded for it, and gets its legacy id. */
describe("UTXO discovery against the legacy scan recordings", () => {
  const cardano = exchangesOf(cardanoScanAccounts[0].apdus);
  const kaspa = exchangesOf(kaspaDataset.currencies?.kaspa?.scanAccounts?.[0].apdus ?? "");

  it("cardano: the address then the extended key of each account", async () => {
    expect(await accountIdDiscovered("cardano_testnet", "cardano", 0, cardano.slice(0, 4))).toBe(
      cardanoRawAccount1.id,
    );
    expect(await accountIdDiscovered("cardano_testnet", "cardano", 1, cardano.slice(4, 8))).toBe(
      `js:2:cardano_testnet:${responseOf(cardano[7])}:cardano`,
    );
  });

  it("kaspa: the key at the account path (after the scan's seed read)", async () => {
    expect(await accountIdDiscovered("kaspa", "", 0, kaspa.slice(1, 2))).toBe(
      kaspaDataset.currencies?.kaspa?.accounts?.[0].raw.id,
    );
    expect(await accountIdDiscovered("kaspa", "", 1, kaspa.slice(2, 3))).toBe(
      `js:2:kaspa:${responseOf(kaspa[2])}:`,
    );
  });
});
