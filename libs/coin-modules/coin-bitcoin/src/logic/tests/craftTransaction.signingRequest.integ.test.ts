import network from "@ledgerhq/live-network";
import { bitcoinDefaults, type BitcoinContext } from "../../config";
import { craftTransaction } from "../craftTransaction";
import { estimateFees } from "../estimateFees";
import type { SigningRequest } from "../signingRequest";

const context: BitcoinContext = {
  config: async currencyId => bitcoinDefaults[currencyId as keyof typeof bitcoinDefaults],
  logger: () => {},
};

/**
 * Whether `address` still holds a confirmed output worth spending, none of its outputs being spent
 * in the mempool: the chain moves between the explorer reads of a test.
 */
async function stillFunded(base: string, address: string): Promise<boolean> {
  const [{ data: utxos }, { data: pending }] = await Promise.all([
    network<{ data: { value: string }[] }>({ url: `${base}/address/${address}/utxos` }),
    network<{ spent?: unknown[] }>({ url: `${base}/address/${address}/utxos/pending` }),
  ]).catch(() => [{ data: { data: [] } }, { data: { spent: [] } }]);
  return (
    (pending.spent ?? []).length === 0 &&
    (utxos.data ?? []).some(utxo => BigInt(utxo.value) >= 1_000_000n)
  );
}

/**
 * An address holding an unspent output in one of the latest Decred blocks. The Decred explorer
 * answers 500 for some transactions (e.g. stake transactions): those are skipped.
 */
async function fundedDecredAddress(): Promise<string> {
  const { explorer, explorerId } = bitcoinDefaults.decred;
  const base = `${explorer.url}/blockchain/v4/${explorerId}`;
  const { data: tip } = await network<{ height: number }>({ url: `${base}/block/current` });
  for (let height = tip.height; height > tip.height - 10; height--) {
    const { data: blocks } = await network<{ txs: string[] }[]>({ url: `${base}/block/${height}` });
    for (const txid of blocks[0]?.txs.slice(1) ?? []) {
      const tx = await network<{
        outputs: { address?: string | null; value: string; spent_at_height?: number | null }[];
      }>({ url: `${base}/tx/${txid}` }).then(
        ({ data }) => data,
        () => undefined,
      );
      // Worth spending: send-max leaves out outputs below their own input's fee, as the bridge does.
      const output = tx?.outputs.find(
        o => o.address?.startsWith("Ds") && !o.spent_at_height && BigInt(o.value) >= 1_000_000n,
      );
      if (output?.address && (await stillFunded(base, output.address))) return output.address;
    }
  }
  throw new Error("no funded Decred address in the last 10 blocks");
}

const send = (sender: string, recipient: string) => ({
  intentType: "transaction" as const,
  type: "send",
  sender,
  recipient,
  amount: 1_000n,
  asset: { type: "native" as const },
  useAllAmount: true,
});

describe("craftTransaction signing requests (mainnet)", () => {
  it.each([
    [
      "komodo",
      async () => "RNjJYvz6aCMaeZanXfCpXvoc2FKxEKMTj2",
      "RW8gfgpCUdgZbkPAs1uJQF2S9681JVkGRi",
    ],
    ["decred", fundedDecredAddress, "DshusByvZ2y4HuUaqkb7LrNTQTrqCjLnBW7"],
  ])(
    "crafts and prices a %s send-max from a funded address",
    async (currencyId, sender, recipient) => {
      const intent = send(await sender(), recipient);
      const estimation = await estimateFees(context, currencyId, intent);
      const crafted = await craftTransaction(context, currencyId, intent);
      const request = JSON.parse(crafted.transaction) as SigningRequest;

      expect(estimation.value).toBeGreaterThan(0n);
      expect(request.currencyId).toBe(currencyId);
      expect(request.inputs.length).toBeGreaterThan(0);
      expect(request.inputs.every(input => /^[0-9a-f]+$/.test(input.prevTxHex))).toBe(true);
      expect(request.outputs).toHaveLength(1);
      expect(request.expiryHeight).toBe("00000000");
      expect(request.outputScriptHex.endsWith(request.outputs[0].script)).toBe(true);
    },
  );
});
