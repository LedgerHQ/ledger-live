import { BigNumber } from "bignumber.js";
import { CoinSelect } from "@ledgerhq/wallet-btc/pickingstrategies/CoinSelect";
import { Custom } from "@ledgerhq/wallet-btc/pickingstrategies/Custom";
import { DeepFirst } from "@ledgerhq/wallet-btc/pickingstrategies/DeepFirst";
import { Merge } from "@ledgerhq/wallet-btc/pickingstrategies/Merge";
import type { PickingStrategy } from "@ledgerhq/wallet-btc/pickingstrategies/types";
import type { Output } from "@ledgerhq/wallet-btc/storage/types";
import type { OutputInfo } from "@ledgerhq/wallet-btc/types";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import type { Explorer } from "../network/explorer";
import { cryptoFor } from "./currency";
import {
  derivationModeOf,
  feeInputs,
  opReturnBuffer,
  recipientScript,
  resolveIntent,
  type BitcoinIntent,
} from "./intent";
import { BITCOIN_PICKING_STRATEGY, type BitcoinUtxoCandidate } from "./types";

type PickingStrategyClass = new (
  ...args: ConstructorParameters<typeof DeepFirst>
) => PickingStrategy;

const PICKING_STRATEGIES: ReadonlyMap<unknown, PickingStrategyClass> = new Map<
  unknown,
  PickingStrategyClass
>([
  [BITCOIN_PICKING_STRATEGY.DEEP_OUTPUTS_FIRST, DeepFirst],
  [BITCOIN_PICKING_STRATEGY.OPTIMIZE_SIZE, CoinSelect],
  [BITCOIN_PICKING_STRATEGY.MERGE_OUTPUTS, Merge],
  [BITCOIN_PICKING_STRATEGY.CUSTOM, Custom],
]);

function pickingStrategyOf(
  strategy: unknown = BITCOIN_PICKING_STRATEGY.DEEP_OUTPUTS_FIRST,
): PickingStrategyClass {
  const Strategy = PICKING_STRATEGIES.get(strategy);
  if (!Strategy) throw new Error(`Unsupported Bitcoin UTXO picking strategy: ${String(strategy)}`);
  return Strategy;
}

const toWalletOutput = (candidate: BitcoinUtxoCandidate): Output => ({
  value: candidate.value,
  address: candidate.address,
  output_hash: candidate.txid,
  output_index: candidate.vout,
  block_height: candidate.height,
  rbf: candidate.replaceable,
});

const outpointOf = ({ txid, vout }: BitcoinUtxoCandidate) => ({ txid, vout });

export type SelectInputsRequest = {
  intent: BitcoinIntent;
  /** What the account may spend: its excluded and reserved outputs already left out. */
  candidates: BitcoinUtxoCandidate[];
  /** A {@link BITCOIN_PICKING_STRATEGY} value. @default DEEP_OUTPUTS_FIRST */
  strategy?: unknown;
  customFeesParameters?: Record<string, unknown> | undefined;
};

/**
 * Coin selection with wallet-btc's picking strategies, at the intent's fee rate. Send-max spends
 * every candidate worth more than what adding it costs. No input while the recipient is not valid
 * or the candidates cannot fund the intent: validation reports why.
 */
export async function selectInputs(
  explorer: Explorer,
  currencyId: string,
  { intent, candidates, strategy, customFeesParameters }: SelectInputsRequest,
): Promise<Array<{ txid: string; vout: number }>> {
  const Strategy = pickingStrategyOf(strategy);
  const { data, feePerByte } = await resolveIntent(
    explorer,
    currencyId,
    intent,
    feeInputs(intent, customFeesParameters),
  );
  const crypto = cryptoFor(currencyId);
  const derivationMode = derivationModeOf(data);

  if (intent.useAllAmount) {
    const rate = Math.max(1, Math.ceil(feePerByte.toNumber()));
    const inputVBytes =
      maxTxVBytesCeil(1, [], false, crypto, derivationMode) -
      maxTxVBytesCeil(0, [], false, crypto, derivationMode);
    const inputCost = BigInt(rate * inputVBytes);
    return candidates.filter(c => BigInt(c.value) > inputCost).map(outpointOf);
  }

  const recipient = recipientScript(currencyId, intent.recipient);
  if (!recipient) return [];
  const opReturn = opReturnBuffer(data);
  const outputs: OutputInfo[] = [
    ...(opReturn
      ? [
          {
            script: crypto.toOpReturnOutputScript(opReturn),
            value: new BigNumber(0),
            address: null,
            isChange: false,
          },
        ]
      : []),
    {
      script: recipient,
      value: new BigNumber(intent.amount.toString()),
      address: intent.recipient,
      isChange: false,
    },
  ];

  try {
    const { unspentUtxos } = new Strategy(crypto, derivationMode, []).selectFromUtxos(
      candidates.map(toWalletOutput),
      outputs,
      feePerByte.toNumber(),
    );
    const picked = new Set(unspentUtxos.map(u => `${u.output_hash}:${u.output_index}`));
    return candidates.filter(c => picked.has(`${c.txid}:${c.vout}`)).map(outpointOf);
  } catch (error) {
    if ((error as Error)?.name === "NotEnoughBalance") return [];
    throw error;
  }
}
