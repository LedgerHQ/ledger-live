import {
  readHistory,
  type AccountData,
  type AccountIntent,
  type AccountOperation,
} from "@ledgerhq/account-module-framework";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { addressPath, deriverOf, nextAddress } from "./addresses";
import { inputsOf, outpointOf } from "./interpret";
import { UtxoAccountNotSyncedError, readState } from "./state";
import type {
  UtxoAccountOptions,
  UtxoAccountState,
  UtxoAddressState,
  UtxoCandidate,
  UtxoCoinIntent,
  UtxoCoinModuleApi,
  UtxoIntentData,
  UtxoState,
} from "./types";

type Chains = { receiveChain: number; changeChain: number };
type IntentInput = NonNullable<UtxoIntentData["inputs"]>[number];

/** Outpoints spent by transactions not in a block yet: the coin selection leaves them alone. */
const reservedOutpoints = (operations: AccountOperation[]): Set<string> =>
  new Set(operations.filter(op => op.block === null).flatMap(inputsOf));

/**
 * The outputs the coin selection may spend: confirmed ones, or unconfirmed change; never one the
 * caller excluded, nor one a pending transaction of the account already spends.
 */
export function selectableUtxos(
  state: UtxoAccountState,
  operations: AccountOperation[],
  changeChain: number,
  excluded: UtxoAccountOptions["excludedUtxos"] = [],
): UtxoState[] {
  const reserved = reservedOutpoints(operations);
  const isExcluded = new Set(excluded.map(e => outpointOf(e.txid, e.vout)));
  const change = new Set(state.addresses.filter(a => a.chain === changeChain).map(a => a.address));
  return state.utxos.filter(utxo => {
    const outpoint = outpointOf(utxo.txid, utxo.vout);
    return (
      (utxo.height !== null || change.has(utxo.address)) &&
      !isExcluded.has(outpoint) &&
      !reserved.has(outpoint)
    );
  });
}

/** Pending transactions of the account, other than `txid`, spending one of `outpoints`. */
export function conflictingTransactions(
  operations: AccountOperation[],
  txid: string,
  outpoints: ReadonlySet<string>,
): string[] {
  const ids = new Set<string>();
  for (const op of operations) {
    if (op.block !== null || !op.hash || op.hash === txid) continue;
    if (inputsOf(op).some(input => outpoints.has(input))) ids.add(op.hash);
  }
  return [...ids];
}

function intentInput(
  ownByAddress: Map<string, UtxoAddressState>,
  derivationPath: string,
  input: { txid: string; vout: number; address?: string | undefined; value: string },
  blockHeight?: number | null,
): IntentInput {
  const owner = input.address === undefined ? undefined : ownByAddress.get(input.address);
  if (!owner) {
    throw new Error(`Input ${input.txid}:${input.vout} is not controlled by the account`);
  }
  return {
    txid: input.txid,
    vout: input.vout,
    address: owner.address,
    path: addressPath(derivationPath, owner.chain, owner.index),
    value: input.value,
    ...(blockHeight === undefined ? {} : { blockHeight }),
  };
}

function withoutAccountOptions(intent: AccountIntent<UtxoAccountOptions>) {
  const { accountOptions: _options, ...rest } = intent;
  return rest;
}

/**
 * The coin intent of an account intent: what only the whole account knows is added to its data —
 * the inputs (coin selection by the coin module, or the replaced transaction's), their signing
 * paths, the change address and the derivation mode.
 */
export async function completeIntent(
  api: UtxoCoinModuleApi,
  { receiveChain, changeChain }: Chains,
  context: Context<any>,
  { descriptor, state: persisted, history }: AccountData<UtxoAccountState>,
  intent: AccountIntent<UtxoAccountOptions>,
  customFeesParameters?: Record<string, unknown>,
): Promise<UtxoCoinIntent> {
  const state = readState(persisted);
  if (!state) throw new UtxoAccountNotSyncedError();
  const derive = deriverOf(api, context, descriptor);
  const [receive, change, operations] = await Promise.all([
    nextAddress(derive, descriptor, state.addresses, receiveChain),
    nextAddress(derive, descriptor, state.addresses, changeChain),
    readHistory(history),
  ]);
  const ownByAddress = new Map(state.addresses.map(a => [a.address, a]));
  const options = intent.accountOptions ?? {};

  const base = {
    ...withoutAccountOptions(intent),
    sender: intent.sender ?? receive.address,
  } as UtxoCoinIntent;
  const data = {
    ...(intent.data ?? api.craftTransactionData?.(context, base) ?? { type: "utxo" }),
    derivationMode: descriptor.derivationMode,
    change: { address: change.address, path: change.derivationPath },
  };

  if (options.replaceTxId) {
    const replaced = await api.getTransaction(context, options.replaceTxId);
    const inputs = replaced.inputs.map(input => {
      if (!input.txid) throw new Error(`Transaction ${replaced.id} spends no previous output`);
      return intentInput(ownByAddress, descriptor.derivationPath, { ...input, txid: input.txid });
    });
    const outpoints = new Set(inputs.map(input => outpointOf(input.txid, input.vout)));
    const conflictingTxIds = conflictingTransactions(operations, replaced.id, outpoints);
    return {
      ...base,
      data: { ...data, inputs, replacement: { txid: replaced.id, conflictingTxIds } },
    };
  }

  const selectable = selectableUtxos(state, operations, changeChain, options.excludedUtxos);
  const candidates: UtxoCandidate[] = selectable.map(
    ({ txid, vout, value, address, height, replaceable }) => ({
      txid,
      vout,
      value,
      address,
      height,
      replaceable,
    }),
  );
  const picked = await api.selectInputs(context, {
    intent: { ...base, data },
    candidates,
    ...(options.strategy === undefined ? {} : { strategy: options.strategy }),
    ...(customFeesParameters ? { customFeesParameters } : {}),
  });
  const byOutpoint = new Map(selectable.map(utxo => [outpointOf(utxo.txid, utxo.vout), utxo]));
  const inputs = picked.map(({ txid, vout }) => {
    const utxo = byOutpoint.get(outpointOf(txid, vout));
    if (!utxo) throw new Error(`Selected output ${txid}:${vout} is not a candidate`);
    return intentInput(ownByAddress, descriptor.derivationPath, utxo, utxo.height);
  });
  return { ...base, data: { ...data, inputs } };
}
