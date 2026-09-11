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
 * delegated, whichever is delegated gets freed. The pair holds one of each in every interleaving,
 * including when one flow's transaction is included before the other reads the chain, so neither
 * assumes a fixed account nor needs the other to have run.
 */
export const MINA_DELEGATION_PAIR = [Account.MINA_1, Account.MINA_2];

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

/** The free account of the pair, which this flow delegates. */
export async function pickMinaAccountToDelegate(): Promise<Account> {
  const states = await fetchPairState();
  const free = states.find(state => !isDelegated(state));
  invariant(free, `No free mina account to delegate from (${pairShape(states)})`);
  return free.account;
}

/** The delegated account of the pair, which this flow frees. */
export async function pickMinaAccountToUndelegate(): Promise<Account> {
  const states = await fetchPairState();
  const delegated = states.find(isDelegated);
  invariant(delegated, `No delegated mina account to undelegate (${pairShape(states)})`);
  return delegated.account;
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

/** A named validator other than the one given: the app rejects delegating to the current one. */
export async function pickMinaValidator(excludedAddress?: string): Promise<MinaValidator> {
  const { data } = await axios.get(`${API_VALIDATORS_BASE_URL}?${VALIDATORS_QUERY}`);
  const validator: MinaValidator | undefined = (data?.content ?? [])
    .map((entry: { validatorAddress: string; validatorName?: string }) => ({
      address: entry.validatorAddress,
      name: entry.validatorName,
    }))
    .find((entry: Partial<MinaValidator>) => entry.name && entry.address !== excludedAddress);
  invariant(validator, "No named mina validator available to delegate to");
  return validator;
}
