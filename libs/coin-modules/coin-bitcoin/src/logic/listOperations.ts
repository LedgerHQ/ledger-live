import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchAddressTxs } from "../network/explorer";
import type { ExplorerTx } from "../network/types";
import { sumByAddress } from "./txMovements";

const distinct = (values: (string | null | undefined)[]): string[] => [
  ...new Set(values.filter((value): value is string => !!value)),
];

/**
 * The operation a confirmed transaction makes on `address`, or `undefined` when it does not move
 * its funds.
 *
 * Values follow the framework convention: an outgoing operation's `value` excludes the fees, which
 * the consumer adds back from `tx.fees`. `tx.fees` is the transaction's whole fee, as the bridge
 * reports it, so `value + tx.fees` is what left the address, as in the bridge.
 * - `OUT`: the address sent funds to others; `value` = what left it minus the fee.
 * - `FEES`: what left the address does not exceed the fee (e.g. funds sent back to itself);
 *   `value` = 0. When it is less than the whole fee (a co-funded transaction), `tx.fees` is what
 *   left the address, so that the balance impact stays exact.
 * - `IN`: the address received more than it spent; `value` = the net amount received.
 */
export function toOperation(tx: ExplorerTx, address: string): Operation | undefined {
  if (!tx.block) return undefined;
  const fees = BigInt(tx.fees);
  const inputs = sumByAddress(tx.inputs);
  const outputs = sumByAddress(tx.outputs);
  const spent = inputs[address] ?? 0n;
  const received = outputs[address] ?? 0n;
  if (spent === 0n && received === 0n) return undefined;

  const debit = spent - received;
  const senders = distinct(tx.inputs.map(input => input.address));
  const onlySender = senders.length === 1 && senders[0] === address;

  let type: string;
  let value: bigint;
  let paidFees = fees;
  if (spent > 0n && debit > fees) {
    type = "OUT";
    value = debit - fees;
  } else if (spent > 0n && debit >= 0n) {
    type = "FEES";
    value = 0n;
    paidFees = debit;
  } else {
    type = "IN";
    value = -debit;
  }

  const recipients =
    type === "IN"
      ? [address]
      : distinct(tx.outputs.map(output => output.address)).filter(a => a !== address);
  const blockTime = new Date(tx.block.time);

  return {
    id: tx.hash,
    type,
    senders,
    recipients,
    value,
    asset: { type: "native" },
    tx: {
      hash: tx.hash,
      block: { height: tx.block.height, hash: tx.block.hash, time: blockTime },
      fees: paidFees,
      ...(onlySender ? { feesPayer: address } : {}),
      date: tx.received_at ? new Date(tx.received_at) : blockTime,
      failed: false,
    },
  };
}

/**
 * One page of the confirmed operations of a single address, newest first unless `order` is `asc`.
 * The explorer's pagination token is returned as `next` and must be passed back as `cursor`;
 * `minHeight` excludes older blocks. Unconfirmed transactions are not listed.
 */
export async function listOperations(
  context: BitcoinContext,
  currencyId: string,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const config = await context.config(currencyId);
  const page = await fetchAddressTxs(config, currencyId, address, {
    minHeight: options.minHeight,
    order: options.order ?? "desc",
    ...(options.limit === undefined ? {} : { limit: options.limit }),
    ...(options.cursor ? { token: options.cursor } : {}),
  });
  const items = (page.data ?? [])
    .map(tx => toOperation(tx, address))
    .filter((operation): operation is Operation => operation !== undefined);
  return { items, next: page.token ?? undefined };
}
