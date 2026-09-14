import { setTimeout as wait } from "node:timers/promises";
import axios from "axios";
import invariant from "invariant";
import { minaConfig } from "@ledgerhq/live-common/families/mina/config";
import { Account } from "../enum/Account";
import { getAccountAddress } from "../cliCommandsUtils";

const { API_MINA_GRAPHQL_NODE, API_VALIDATORS_BASE_URL } = (
  minaConfig.config_currency_mina.default as {
    infra: { API_MINA_GRAPHQL_NODE: string; API_VALIDATORS_BASE_URL: string };
  }
).infra;

const DELEGATE_ACCOUNT_QUERY = `
  query GetDelegateAccount($publicKey: String!) {
    account(publicKey: $publicKey) {
      delegateAccount {
        publicKey
      }
    }
  }
`;

/**
 * A transaction sits in the pool for about one block before it is included. Until then the chain
 * still reports the state the account is leaving, so an account with a pooled command has not
 * arrived anywhere yet and must not be handed to a flow.
 */
const PENDING_COMMANDS_QUERY = `
  query GetPendingCommands($publicKey: PublicKey!) {
    pooledUserCommands(publicKey: $publicKey) {
      nonce
    }
  }
`;

// The node answers the queries below in about 150 ms. A request still outstanding after this is a
// hung socket, which without a timeout would hold the flow until the test runner kills it.
const MINA_NODE_TIMEOUT_MS = 30 * 1000;

// The query the app builds its validator list from, so a validator picked here is one it offers.
const VALIDATORS_QUERY =
  "page=0&size=20&orderBy=DESC&sortBy=DELEGATORS&type=ACTIVE&isVerifiedOnly=true";

/**
 * Delegating and undelegating are inverses, so they share a pair: whichever account is free gets
 * delegated, whichever is delegated gets freed. Once both transactions are included the pair holds
 * one of each again, so neither flow assumes a fixed account nor needs the other to have run.
 */
export const MINA_DELEGATION_PAIR = [Account.MINA_1, Account.MINA_2];

/**
 * A spec seeding the pair syncs two accounts, and the rosetta node answers /search/transactions in
 * 35 s or so per account whatever its history, so the app settles well after the budget one slow
 * account gets.
 */
export const MINA_PAIR_SYNC_TIMEOUT_MS = 150 * 1000;

/**
 * A picker can find the pair unusable for two reasons, both of which pass on their own: a
 * transaction of the pair still in the pool, or the two accounts transiently in the same state
 * between the delegate and the undelegate transaction being included.
 *
 * So a picker waits rather than failing: one mina inclusion takes about three minutes, and the
 * budget covers the pool plus the settle. Outside those windows the first read already matches and
 * costs nothing.
 */
export const MINA_PAIR_SETTLE_TIMEOUT_MS = 6 * 60 * 1000;
const PAIR_POLL_INTERVAL_MS = 15 * 1000;

/**
 * Redelegating only moves a delegation from one validator to another, so it leaves its account
 * delegated — and a transaction that fails leaves the previous delegation untouched. Keeping it out
 * of the pair means its own precondition is the state it produces, and the specs stay independent:
 * the three flows can run concurrently, in any order, broadcasting.
 *
 * Nothing in the suite can therefore free this account: no flow undelegates it and none debits it.
 * If it ever is free, someone did it by hand, and only a delegation sent by hand puts it back.
 */
export const MINA_REDELEGATION_ACCOUNT = Account.MINA_3;

export type MinaValidator = { address: string; name: string };

export type MinaRedelegation = { account: Account; validatorAddress: string };

/** A pair account, with the address the pickers resolved it to. */
export type MinaPick = { account: Account; address: string };

type DelegationState = MinaPick & { validatorAddress?: string; pending: boolean };

type GraphqlResponse<T> = { data?: T | null; errors?: { message?: string }[] };

/**
 * The node answers 200 with `{ data: null, errors: [...] }` on a rejected query, and
 * `{ account: null }` for an address it does not know. Reading either as an answer would report an
 * account whose state could not be determined as "not delegated" — so both raise here, and the
 * caller's retry budget decides whether it was transient.
 */
async function queryNode<T>(
  query: string,
  variables: Record<string, unknown>,
  subject: string,
): Promise<T> {
  const { data } = await axios.post<GraphqlResponse<T>>(
    API_MINA_GRAPHQL_NODE,
    { query, variables },
    { timeout: MINA_NODE_TIMEOUT_MS },
  );

  const errors = data?.errors;
  invariant(
    !errors?.length,
    `mina node rejected the ${subject} query: ${errors?.map(e => e.message ?? "unknown error").join("; ")}`,
  );
  invariant(data?.data, `mina node returned no data for the ${subject} query`);
  return data.data;
}

type DelegateAccountData = {
  account: { delegateAccount?: { publicKey?: string } | null } | null;
};

async function fetchDelegationState(account: Account): Promise<DelegationState> {
  const address = await getAccountAddress(account);

  const { account: onChain } = await queryNode<DelegateAccountData>(
    DELEGATE_ACCOUNT_QUERY,
    { publicKey: address },
    "delegation",
  );
  invariant(onChain, `mina node knows no account at ${address} (${account.accountName})`);

  const { pooledUserCommands } = await queryNode<{ pooledUserCommands: unknown[] }>(
    PENDING_COMMANDS_QUERY,
    { publicKey: address },
    "pending commands",
  );

  const delegate = onChain.delegateAccount?.publicKey;
  return {
    account,
    address,
    validatorAddress: delegate && delegate !== address ? delegate : undefined,
    pending: pooledUserCommands.length > 0,
  };
}

async function fetchPairState(): Promise<DelegationState[]> {
  const states: DelegationState[] = [];
  for (const account of MINA_DELEGATION_PAIR) {
    // Address derivation goes through speculos, so keep it sequential.
    states.push(await fetchDelegationState(account));
  }
  return states;
}

function isDelegated(state: DelegationState): boolean {
  return state.validatorAddress !== undefined;
}

function pairShape(states: DelegationState[]) {
  return states
    .map(state => {
      const held = isDelegated(state) ? "delegated" : "free";
      return `${state.account.accountName}: ${held}${state.pending ? ", tx pending" : ""}`;
    })
    .join(", ");
}

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Poll until the pair offers a usable account, so that the transient shapes resolve themselves
 * instead of failing the flow. Reading the chain is part of what is retried: the node this talks to
 * is known to time out under load, and a single unlucky read should not spend the whole budget.
 */
async function pickFromPair(delegated: boolean): Promise<DelegationState> {
  const deadline = Date.now() + MINA_PAIR_SETTLE_TIMEOUT_MS;
  let blocker = "not read yet";

  for (;;) {
    try {
      const states = await fetchPairState();
      // A pooled transaction means the account is still moving: taking it would sign a second
      // transaction on a nonce the first already spent — which is what a retry of a flow that
      // broadcast then failed later would otherwise do, twice, since CI retries twice.
      const match = states.find(state => !state.pending && isDelegated(state) === delegated);
      if (match) return match;
      blocker = pairShape(states);
    } catch (error) {
      blocker = `could not read the pair — ${describeError(error)}`;
    }

    const wanted = delegated ? "delegated" : "free";
    invariant(
      Date.now() < deadline,
      `No settled ${wanted} mina account in the pair after ${MINA_PAIR_SETTLE_TIMEOUT_MS / 60_000} min (${blocker})`,
    );
    await wait(PAIR_POLL_INTERVAL_MS);
  }
}

/** The free account of the pair, which this flow delegates. */
export function pickMinaAccountToDelegate(): Promise<MinaPick> {
  return pickFromPair(false);
}

/** The delegated account of the pair, which this flow frees. */
export function pickMinaAccountToUndelegate(): Promise<MinaPick> {
  return pickFromPair(true);
}

/** The dedicated account and the validator it currently delegates to, which cannot be reselected. */
export async function pickMinaRedelegation(): Promise<MinaRedelegation> {
  const deadline = Date.now() + MINA_PAIR_SETTLE_TIMEOUT_MS;
  let blocker = "not read yet";

  for (;;) {
    try {
      const state = await fetchDelegationState(MINA_REDELEGATION_ACCOUNT);
      // Same reasoning as the pair: a redelegation signed while the previous one is still pooled
      // would reuse its nonce.
      if (!state.pending && state.validatorAddress) {
        return { account: state.account, validatorAddress: state.validatorAddress };
      }
      blocker = pairShape([state]);
    } catch (error) {
      blocker = `could not read the account — ${describeError(error)}`;
    }

    invariant(
      Date.now() < deadline,
      `${MINA_REDELEGATION_ACCOUNT.accountName} holds no settled delegation to move after ` +
        `${MINA_PAIR_SETTLE_TIMEOUT_MS / 60_000} min (${blocker}). No flow frees this account, so a ` +
        `free one means it was undelegated by hand and has to be delegated again the same way.`,
    );
    await wait(PAIR_POLL_INTERVAL_MS);
  }
}

type ValidatorEntry = { validatorAddress: string; validatorName?: string };

/** A named validator other than the one given: the app rejects delegating to the current one. */
export async function pickMinaValidator(excludedAddress?: string): Promise<MinaValidator> {
  const { data } = await axios.get<{ content?: ValidatorEntry[] }>(
    `${API_VALIDATORS_BASE_URL}?${VALIDATORS_QUERY}`,
    { timeout: MINA_NODE_TIMEOUT_MS },
  );
  // An unnamed validator cannot be searched for in the app's list, so it is not selectable.
  const named = (data?.content ?? []).flatMap(({ validatorAddress, validatorName }) =>
    validatorName ? [{ address: validatorAddress, name: validatorName }] : [],
  );
  const validator = named.find(entry => entry.address !== excludedAddress);
  invariant(validator, "No named mina validator available to delegate to");
  return validator;
}
