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

// The query the app builds its validator list from, so a validator picked here is one it offers.
const VALIDATORS_QUERY =
  "page=0&size=20&orderBy=DESC&sortBy=DELEGATORS&type=ACTIVE&isVerifiedOnly=true";

/**
 * A mina account delegates its whole balance or nothing at all, so each staking flow needs an
 * account in a given state, and every broadcasting run moves one of them: `Mina 1` is not the
 * delegating account, it is whichever account happens to be free when the run starts.
 *
 * The pool holds one free account and two delegated ones. Delegating takes the free account,
 * undelegating frees one of the delegated ones and redelegating keeps the other delegated, so the
 * shape is preserved and the three flows never emit from the same account on a broadcasting night.
 */
export const MINA_STAKING_ACCOUNTS = [Account.MINA_1, Account.MINA_2, Account.MINA_3];

export type MinaValidator = { address: string; name: string };

export type StakedMinaAccount = { account: Account; validatorAddress: string };

type DelegationState = { account: Account; validatorAddress?: string };

/** The validator an account delegates to, or undefined when it delegates to itself. */
async function fetchDelegate(address: string): Promise<string | undefined> {
  const { data } = await axios.post(API_MINA_GRAPHQL_NODE, {
    query: `query { account(publicKey: "${address}") { delegate } }`,
  });
  const delegate: string | undefined = data?.data?.account?.delegate;
  return delegate && delegate !== address ? delegate : undefined;
}

async function fetchPoolState(): Promise<DelegationState[]> {
  const states: DelegationState[] = [];
  for (const account of MINA_STAKING_ACCOUNTS) {
    // Address derivation goes through speculos, so keep it sequential.
    const address = await getAccountAddress(account);
    states.push({ account, validatorAddress: await fetchDelegate(address) });
  }
  return states;
}

function isStaked(state: DelegationState): state is StakedMinaAccount {
  return state.validatorAddress !== undefined;
}

function poolShape(states: DelegationState[]) {
  return states
    .map(state => `${state.account.accountName}: ${isStaked(state) ? "delegated" : "free"}`)
    .join(", ");
}

/** The free account, which the delegate flow stakes. */
export async function pickMinaAccountToDelegate(): Promise<Account> {
  const states = await fetchPoolState();
  const free = states.find(state => !isStaked(state));
  invariant(free, `No free mina account to delegate from (${poolShape(states)})`);
  return free.account;
}

/**
 * The first delegated account. Undelegating and redelegating split the two delegated accounts by
 * pool order, so a broadcasting run never sends two transactions from the same account.
 */
export async function pickMinaAccountToUndelegate(): Promise<StakedMinaAccount> {
  const states = await fetchPoolState();
  const staked = states.filter(isStaked);
  invariant(staked.length > 0, `No delegated mina account to undelegate (${poolShape(states)})`);
  return staked[0];
}

/** The second delegated account, the one the undelegate flow leaves alone. */
export async function pickMinaAccountToRedelegate(): Promise<StakedMinaAccount> {
  const states = await fetchPoolState();
  const staked = states.filter(isStaked);
  invariant(
    staked.length > 1,
    `Only ${staked.length} mina account(s) delegated, redelegating would claim the one the ` +
      `undelegate flow uses (${poolShape(states)})`,
  );
  return staked[1];
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
