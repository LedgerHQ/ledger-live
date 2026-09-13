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
 * Between the two transactions being included the pair transiently holds two accounts in the same
 * state, and a picker reading right then finds nothing to work on. That happens on a retry of the
 * flow that just broadcast, and on the platform that is not broadcasting while the other mutates
 * the pair — the weekly nightlies run both platforms but only let one broadcast.
 *
 * So a picker waits the window out rather than failing on it: a mina transaction is included in
 * about three minutes, and outside the window the first read already matches and costs nothing.
 */
export const MINA_PAIR_SETTLE_TIMEOUT_MS = 4 * 60 * 1000;
const PAIR_POLL_INTERVAL_MS = 15 * 1000;

/**
 * Redelegating only moves a delegation from one validator to another, so it leaves its account
 * delegated. Keeping it out of the pair means its own precondition is the state it produces, and
 * the specs stay independent: the three flows can run concurrently, in any order, broadcasting.
 */
export const MINA_REDELEGATION_ACCOUNT = Account.MINA_3;

export type MinaValidator = { address: string; name: string };

export type MinaRedelegation = { account: Account; validatorAddress: string };

type DelegationState = { account: Account; validatorAddress?: string };

/** The validator an account delegates to, or undefined when it delegates to itself. */
async function fetchDelegate(address: string): Promise<string | undefined> {
  const { data } = await axios.post(API_MINA_GRAPHQL_NODE, {
    query: DELEGATE_ACCOUNT_QUERY,
    variables: { publicKey: address },
  });
  const delegate: string | undefined = data?.data?.account?.delegateAccount?.publicKey;
  return delegate && delegate !== address ? delegate : undefined;
}

async function fetchDelegationState(account: Account): Promise<DelegationState> {
  const address = await getAccountAddress(account);
  return { account, validatorAddress: await fetchDelegate(address) };
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
    .map(state => `${state.account.accountName}: ${isDelegated(state) ? "delegated" : "free"}`)
    .join(", ");
}

/** The account of the pair in the given state, waiting out a pair caught mid-swap. */
async function pickFromPair(delegated: boolean): Promise<Account> {
  const deadline = Date.now() + MINA_PAIR_SETTLE_TIMEOUT_MS;
  for (;;) {
    const states = await fetchPairState();
    const match = states.find(state => isDelegated(state) === delegated);
    if (match) return match.account;

    const wanted = delegated ? "delegated" : "free";
    invariant(
      Date.now() < deadline,
      `No ${wanted} mina account in the pair after ${MINA_PAIR_SETTLE_TIMEOUT_MS / 60_000} min (${pairShape(states)})`,
    );
    await wait(PAIR_POLL_INTERVAL_MS);
  }
}

/** The free account of the pair, which this flow delegates. */
export function pickMinaAccountToDelegate(): Promise<Account> {
  return pickFromPair(false);
}

/** The delegated account of the pair, which this flow frees. */
export function pickMinaAccountToUndelegate(): Promise<Account> {
  return pickFromPair(true);
}

/** The dedicated account and the validator it currently delegates to, which cannot be reselected. */
export async function pickMinaRedelegation(): Promise<MinaRedelegation> {
  const { account, validatorAddress } = await fetchDelegationState(MINA_REDELEGATION_ACCOUNT);
  invariant(
    validatorAddress,
    `${MINA_REDELEGATION_ACCOUNT.accountName} is not delegated: redelegating needs a delegation to move`,
  );
  return { account, validatorAddress };
}

type ValidatorEntry = { validatorAddress: string; validatorName?: string };

/** A named validator other than the one given: the app rejects delegating to the current one. */
export async function pickMinaValidator(excludedAddress?: string): Promise<MinaValidator> {
  const { data } = await axios.get<{ content?: ValidatorEntry[] }>(
    `${API_VALIDATORS_BASE_URL}?${VALIDATORS_QUERY}`,
  );
  // An unnamed validator cannot be searched for in the app's list, so it is not selectable.
  const named = (data?.content ?? []).flatMap(({ validatorAddress, validatorName }) =>
    validatorName ? [{ address: validatorAddress, name: validatorName }] : [],
  );
  const validator = named.find(entry => entry.address !== excludedAddress);
  invariant(validator, "No named mina validator available to delegate to");
  return validator;
}
