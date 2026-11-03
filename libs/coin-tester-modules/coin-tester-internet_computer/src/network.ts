import {
  Actor,
  type ActorMethod,
  type ActorSubclass,
  AnonymousIdentity,
  HttpAgent,
  type Identity,
} from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_INDEX_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
  TRANSFER_FEE,
} from "@ledgerhq/coin-internet_computer/consts";
import { AccountIdentifier } from "@ledgerhq/coin-internet_computer/logic/accountIdentifier";
import { fetchBlockHeight, queryBalance } from "@ledgerhq/coin-internet_computer/network/api";
import {
  governanceIdlFactory,
  indexIdlFactory,
  ledgerIdlFactory,
} from "@ledgerhq/coin-internet_computer/network/candid";
import type { ListNeuronsResponse, RawNeuron } from "@ledgerhq/coin-internet_computer/types/neuron";
import { NODE_URL } from "./localIcp";
import { identityAt } from "./signer";

const POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 1_000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const agentFor = (identity: Identity) =>
  HttpAgent.create({ host: NODE_URL, identity, shouldFetchRootKey: true });

type LedgerActor = ActorSubclass<{
  transfer: ActorMethod<[unknown], { Ok?: bigint; Err?: unknown }>;
}>;

type IndexActor = ActorSubclass<{
  status: ActorMethod<[], { num_blocks_synced: bigint }>;
}>;

type GovernanceActor = ActorSubclass<{
  list_neurons: ActorMethod<[unknown], ListNeuronsResponse>;
}>;

/** The anonymous principal holds the local ledger's initial supply. */
const ANONYMOUS_ACCOUNT = AccountIdentifier.fromPrincipal({
  principal: Principal.anonymous(),
}).toHex();

/** The ledger balance of `address` as the index canister reports it, which lags the ledger. */
const indexedBalance = async (address: string): Promise<bigint | undefined> => {
  try {
    return await queryBalance(NODE_URL, address);
  } catch {
    return undefined;
  }
};

async function poll<T>(
  what: string,
  read: () => Promise<T | undefined>,
  done: (value: T) => boolean,
): Promise<T> {
  let last: T | undefined;
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
    last = await read();
    if (last !== undefined && done(last)) return last;
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${what} (last read: ${String(last)})`);
}

/** Waits until the NNS answers: the index reports the anonymous principal's supply. */
export const waitForNns = (): Promise<bigint> =>
  poll(
    "the NNS canisters",
    () => indexedBalance(ANONYMOUS_ACCOUNT),
    balance => balance > 0n,
  );

/** Waits until the index canister reports `expected` e8s on `address`. */
export const waitForIndexedBalance = (address: string, expected: bigint): Promise<bigint> =>
  poll(
    `the index to report ${expected} e8s on ${address}`,
    () => indexedBalance(address),
    b => b === expected,
  );

/**
 * Waits until the index canister has read every ledger block. The account sync takes the ledger tip
 * as its height but reads history from the index, and the local ledger only grows when a test
 * transfers: a sync that ran before the index caught up would skip the tip's transaction for good.
 */
export async function waitForIndexSynced(): Promise<void> {
  const index: IndexActor = Actor.createActor(indexIdlFactory, {
    agent: await agentFor(new AnonymousIdentity()),
    canisterId: MAINNET_INDEX_CANISTER_ID,
  });
  const tip = BigInt((await fetchBlockHeight(NODE_URL)).toFixed());
  await poll(
    `the index to reach ledger block ${tip}`,
    async () => (await index.status()).num_blocks_synced,
    synced => synced >= tip,
  );
}

/**
 * Sends `amount` e8s from the anonymous principal to `address` with a ledger `transfer`, then waits
 * until the index reports it, since the bridge and the API read balances from the index.
 */
export async function fund(address: string, amount: bigint): Promise<void> {
  await waitForNns();
  const before = (await indexedBalance(address)) ?? 0n;
  const ledger: LedgerActor = Actor.createActor(ledgerIdlFactory, {
    agent: await agentFor(new AnonymousIdentity()),
    canisterId: MAINNET_LEDGER_CANISTER_ID,
  });
  const result = await ledger.transfer({
    to: AccountIdentifier.fromHex(address).toUint8Array(),
    amount: { e8s: amount },
    fee: { e8s: TRANSFER_FEE },
    memo: 0n,
    from_subaccount: [],
    created_at_time: [],
  });
  if (result.Err !== undefined) {
    throw new Error(
      `The funding transfer failed: ${JSON.stringify(result.Err, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      )}`,
    );
  }
  await waitForIndexedBalance(address, before + amount);
}

/**
 * The full neurons governance lets the key at `path` read, queried as that key's principal: the
 * account sync never reads neuron state, so the tests read it from governance themselves.
 */
export async function listNeuronsOf(path: string): Promise<RawNeuron[]> {
  const governance: GovernanceActor = Actor.createActor(governanceIdlFactory, {
    agent: await agentFor(identityAt(path)),
    canisterId: MAINNET_GOVERNANCE_CANISTER_ID,
  });
  const { full_neurons } = await governance.list_neurons({
    neuron_ids: [],
    include_neurons_readable_by_caller: true,
    include_empty_neurons_readable_by_caller: [],
    include_public_neurons_in_full_neurons: [],
    neuron_subaccounts: [],
    page_number: [],
    page_size: [],
  });
  return full_neurons;
}

/** The id of a raw neuron, as the decimal string the bridge and the API use. */
export const neuronIdOf = (neuron: RawNeuron): string | undefined => neuron.id[0]?.id.toString();
