import network from "@ledgerhq/live-network";
import { createApi } from "../../api";
import type { BitcoinContext } from "../../config";
import { mapTxToOperations } from "../../logic";
import { toOperation } from "../../logic/listOperations";
import type { ExplorerTx } from "../../network/types";
import { EMPTIED_P2PKH, EMPTIED_P2WPKH, FUNDED_P2WPKH } from "../../logic/tests/helpers/fixtures";

const EXPLORER = "https://explorers.api.live.ledger.com";

const shown = (operation: { type: string; value: bigint; tx: { fees: bigint } }) =>
  operation.type === "IN" ? operation.value : operation.value + operation.tx.fees;

/**
 * Parity with the bridge on real transactions, co-funded ones included: what Ledger Live shows for
 * an operation (type, value with fees re-added for outgoing ones, fee) must not change when the
 * history comes from the coin module API. The address is its own change address.
 */
describe("listOperations parity with the bridge (mainnet)", () => {
  it.each([EMPTIED_P2PKH, EMPTIED_P2WPKH, FUNDED_P2WPKH])(
    "maps every transaction of %s as the bridge does",
    async address => {
      const { data } = await network<{ data: ExplorerTx[] }>({
        url: `${EXPLORER}/blockchain/v4/btc/address/${address}/txs?batch_size=20`,
      });
      expect(data.data.length).toBeGreaterThan(0);
      for (const tx of data.data) {
        const legacyOperations = mapTxToOperations(
          tx as never,
          "bitcoin",
          "account",
          new Set([address]),
          new Set([address]),
        );
        expect(legacyOperations).toHaveLength(1);
        const legacy = legacyOperations[0]!;
        const operation = toOperation(tx, address)!;
        expect({ hash: tx.hash, value: shown(operation), fee: operation.tx.fees }).toEqual({
          hash: tx.hash,
          value: BigInt(legacy.value.toFixed()),
          fee: BigInt(legacy.fee.toFixed()),
        });
      }
    },
  );

  // The formats the Ledger app builds itself.
  it.each([
    ["komodo", "kmd", "RW8gfgpCUdgZbkPAs1uJQF2S9681JVkGRi"],
    ["decred", "dcr", "DsVETTBzJSuzszSTiJLmrswY47GcCKCRu5E"],
  ])(
    "maps the %s operations of an address as the bridge does",
    async (currencyId, explorerId, address) => {
      const context: BitcoinContext = {
        config: async () => ({
          status: { type: "active" },
          name: explorerId,
          unit: { name: explorerId, code: explorerId.toUpperCase(), magnitude: 8 },
          explorer: { url: EXPLORER },
          explorerId,
        }),
        logger: () => {},
      };
      const { items } = await createApi(currencyId).listOperations(context, address, {
        minHeight: 0,
      });
      const { data } = await network<{ data: ExplorerTx[] }>({
        url: `${EXPLORER}/blockchain/v4/${explorerId}/address/${address}/txs?batch_size=50`,
      });
      expect(items.length).toBeGreaterThan(0);
      for (const operation of items) {
        const tx = data.data.find(t => t.hash === operation.tx.hash)!;
        const [legacy] = mapTxToOperations(
          tx as never,
          currencyId,
          "account",
          new Set([address]),
          new Set([address]),
        );
        expect({ type: operation.type, value: shown(operation), fee: operation.tx.fees }).toEqual({
          type: legacy!.type,
          value: BigInt(legacy!.value.toFixed()),
          fee: BigInt(legacy!.fee.toFixed()),
        });
      }
    },
  );
});
