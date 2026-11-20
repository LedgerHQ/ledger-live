import { from, switchMap } from "rxjs";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { candidateOf } from "@domain/entity-derivation";
import type { DerivationMode } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { placeholderAccount } from "../full-sync/placeholderAccount";
import { deriveOnTransport, type RunDeviceJob } from "./deriveOnSession";

jest.mock("../../bridge/mockMode", () => ({ usesMockBridges: () => false }));

/** The legacy cardano_testnet scan recording, from the former coin-cardano bridge dataset. */
const cardanoScanApdus = `
    => d700000000
    <= 080008009000
    => d71101002d0000058000073c8000071780000000000000000000000022058000073c80000717800000000000000200000000
    <= 00bea94629d5cf776b8374a00afa15686f0b0742dd0330f86804c61202b5de20d8ec4cd8ca0ba6183589fec7a09896b7643d2176b8a447ac369000
    => d700000000
    <= 080008009000
    => d71000000d038000073c8000071780000000
    <= 806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d9000
    => d700000000
    <= 080008009000
    => d71101002d0000058000073c8000071780000001000000000000000022058000073c80000717800000010000000200000000
    <= 0009457d98f405191765830c1afe91cc32b5f45c193a9aad4b606f8f5dd599d97135c125c5633d3d4431be87a9cff26ec08d388833bfcc530f9000
    => d700000000
    <= 080008009000
    => d71000000d038000073c8000071780000001
    <= ed5e0d059cb2eed53ea30b9ba84bb3aaa6c2364c6305a0c9a7e8944aa439884a642cc2f06e601808926e14b6e27417be0b0323d5a5149f1eebab8fc4e1fe14d49000
`;
const cardanoAccount0Id =
  "js:2:cardano_testnet:806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d:cardano";

/** The legacy kaspa scan recording, from the former coin-kaspa bridge dataset. */
const kaspaScanApdus = `
      => e00500000d038000002c8001b20780000000
      <= 41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a55769000
      => e00500000d038000002c8001b20780000000
      <= 41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a55769000
      => e00500000d038000002c8001b20780000001
      <= 4104751b5ebd4a9d2a0a25d5c37cab4814a95335b8945cfcaa6a4138de418f581bb1d0d02f22081b3cda223a51e18a63ebdffd64803e0988b68a91802738a5a9f901206d4a2b989a82b5fb160f0151ea5d046451a291a0748f3038ecdc63d637cce00b9000
`;
const kaspaAccount0Id =
  "js:2:kaspa:41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a5576:";

/** The `=>`/`<=` pairs of a recording. */
const exchangesOf = (apdus: string): string[][] => {
  const lines = apdus
    .trim()
    .split("\n")
    .map(line => line.trim());
  return lines.flatMap((line, i) => (i % 2 === 0 ? [[line, lines[i + 1]]] : []));
};

const replaying =
  (store: RecordStore): RunDeviceJob =>
  job =>
    from(openTransportReplayer(store)).pipe(switchMap(transport => job(transport)));

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
  const cardano = exchangesOf(cardanoScanApdus);
  const kaspa = exchangesOf(kaspaScanApdus);

  it("cardano: the address then the extended key of each account", async () => {
    expect(await accountIdDiscovered("cardano_testnet", "cardano", 0, cardano.slice(0, 4))).toBe(
      cardanoAccount0Id,
    );
    expect(await accountIdDiscovered("cardano_testnet", "cardano", 1, cardano.slice(4, 8))).toBe(
      `js:2:cardano_testnet:${responseOf(cardano[7])}:cardano`,
    );
  });

  it("kaspa: the key at the account path (after the scan's seed read)", async () => {
    expect(await accountIdDiscovered("kaspa", "", 0, kaspa.slice(1, 2))).toBe(kaspaAccount0Id);
    expect(await accountIdDiscovered("kaspa", "", 1, kaspa.slice(2, 3))).toBe(
      `js:2:kaspa:${responseOf(kaspa[2])}:`,
    );
  });
});
