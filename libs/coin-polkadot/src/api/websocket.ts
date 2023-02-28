/*
THIS FILE IS UNUSED AND PROVIDED AS EXAMPLE FOR USING POLKADOT'S WEBSOCKET API DIRECTLY

POLKADOT.JS API VERSION 2.5.1
*/

/* eslint-disable */

/* istanbul ignore file */
import uniq from "lodash/uniq";
import compact from "lodash/compact";
import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
//@ts-expect-error
import { WsProvider, ApiPromise } from "@polkadot/api";
import { u8aToString } from "@polkadot/util";
import { AccountId, Registration } from "@polkadot/types/interfaces";
import { Data, Option } from "@polkadot/types";
import type { ITuple } from "@polkadot/types/types";
import type { PolkadotValidator, PolkadotStakingProgress } from "../types";
type AsyncApiFunction = (api: typeof ApiPromise) => Promise<any>;
const VALIDATOR_COMISSION_RATIO = 1000000000;

const getWsUrl = () => getEnv("API_POLKADOT_NODE");

const WEBSOCKET_DEBOUNCE_DELAY = 30000;
let api;
let pendingQueries: Array<Promise<any>> = [];
let apiDisconnectTimeout;

/**
 * Connects to Substrate Node, executes calls then disconnects
 *
 * @param {*} execute - the calls to execute on api
 */
async function withApi(execute: AsyncApiFunction): Promise<any> {
  // If client is instanciated already, ensure it is connected & ready
  if (api) {
    try {
      await api.isReadyOrError;
    } catch (err) {
      // definitely not connected...
      api = null;
      pendingQueries = [];
    }
  }

  if (!api) {
    const wsProvider = new WsProvider(
      getWsUrl(),
      /* autoConnectMs = */
      false
    );
    wsProvider.connect();
    api = await new ApiPromise({
      provider: wsProvider,
    }).isReadyOrError;
  }

  cancelDebouncedDisconnect();

  try {
    const query = execute(api);
    pendingQueries.push(query.catch((err) => err));
    const res = await query;
    return res;
  } finally {
    debouncedDisconnect();
  }
}

/**
 * Disconnects Websocket API client after all pending queries are flushed.
 */
export const disconnect = async () => {
  cancelDebouncedDisconnect();

  if (api) {
    const disconnecting = api;
    const pending = pendingQueries;
    api = undefined;
    pendingQueries = [];
    await Promise.all(pending);
    await disconnecting.disconnect();
  }
};

const cancelDebouncedDisconnect = () => {
  if (apiDisconnectTimeout) {
    clearTimeout(apiDisconnectTimeout);
    apiDisconnectTimeout = null;
  }
};

/**
 * Disconnects Websocket client after a delay.
 */
const debouncedDisconnect = () => {
  cancelDebouncedDisconnect();
  apiDisconnectTimeout = setTimeout(disconnect, WEBSOCKET_DEBOUNCE_DELAY);
};

/**
 * Returns true if ElectionStatus is Close. If ElectionStatus is Open, some features must be disabled.
 */
export const isElectionClosed = async (): Promise<Boolean> =>
  withApi(async (api: typeof ApiPromise) => {
    const status = await api.query.staking.eraElectionStatus();
    const res = status.isClose;
    return !!res;
  });

/**
 * Returns true if the address is a new account with no balance
 *
 * @param {*} addr
 */
export const isNewAccount = async (address: string): Promise<Boolean> =>
  withApi(async (api: typeof ApiPromise) => {
    const {
      nonce,
      data: { free },
    } = await api.query.system.account(address);
    return (
      new BigNumber(0).isEqualTo(nonce) && new BigNumber(0).isEqualTo(free)
    );
  });

/**
 * Returns true if the address is a new account with no balance
 *
 * @param {*} addr
 */
export const isControllerAddress = async (address: string): Promise<Boolean> =>
  withApi(async (api: typeof ApiPromise) => {
    const ledgetOpt = await api.query.staking.ledger(address);
    return ledgetOpt.isSome;
  });

/**
 * Get all validators addresses to check for validity.
 */
const getValidatorsStashesAddresses = async (): Promise<string[]> =>
  withApi(async (api: typeof ApiPromise) => {
    const list = await api.derive.staking.stashes();
    return list.map((v) => v.toString());
  });

/**
 * Returns all addresses that are not validators
 */
export const verifyValidatorAddresses = async (
  validators: string[]
): Promise<string[]> => {
  const allValidators = await getValidatorsStashesAddresses();
  return validators.filter((v) => !allValidators.includes(v));
};

/**
 * Get all account-related data
 *
 * @param {*} addr
 */
export const getAccount = async (addr: string) =>
  withApi(async () => {
    const balances = await getBalances(addr);
    const stakingInfo = await getStakingInfo(addr);
    const nominations = await getNominations(addr);
    return { ...balances, ...stakingInfo, nominations };
  });

/**
 * Returns all the balances for an account
 *
 * @param {*} addr - the account address
 */
export const getBalances = async (addr: string) =>
  withApi(async (api: typeof ApiPromise) => {
    const [finalizedHash, balances] = await Promise.all([
      api.rpc.chain.getFinalizedHead(),
      api.derive.balances.all(addr),
    ]);
    const { number } = await api.rpc.chain.getHeader(finalizedHash);
    return {
      blockHeight: number.toNumber(),
      balance: new BigNumber(balances.freeBalance),
      spendableBalance: new BigNumber(balances.availableBalance),
      nonce: balances.accountNonce.toNumber(),
      lockedBalance: new BigNumber(balances.lockedBalance),
    };
  });

/**
 * Returns all staking-related data for an account
 *
 * @param {*} addr
 */
export const getStakingInfo = async (addr: string) =>
  withApi(async (api: typeof ApiPromise) => {
    const [controlledLedgerOpt, bonded] = await Promise.all([
      api.query.staking.ledger(addr),
      api.query.staking.bonded(addr),
    ]);
    // NOTE: controlledLedgerOpt is not the current stash ledger...
    const stash = controlledLedgerOpt.isSome
      ? controlledLedgerOpt.unwrap().stash.toString()
      : null;
    const controller = bonded.isSome ? bonded.unwrap().toString() : null;

    // If account is not a stash, no need to fetch corresponding ledger
    if (!controller) {
      return {
        controller: null,
        stash: stash || null,
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(0),
        unlockings: [],
      };
    }

    const [activeOpt, ledgerOpt] = await Promise.all([
      api.query.staking.activeEra(),
      api.query.staking.ledger(controller),
    ]);
    const now = new Date();
    const { index, start } = activeOpt.unwrapOrDefault();
    const activeEraIndex = index.toNumber();
    const activeEraStart = start.unwrap().toNumber();
    const blockTime = api.consts.babe.expectedBlockTime; // 6000 ms

    const epochDuration = api.consts.babe.epochDuration; // 2400 blocks

    const eraLength = api.consts.staking.sessionsPerEra // 6 sessions
      .mul(epochDuration)
      .mul(blockTime)
      .toNumber();
    const ledger = ledgerOpt.isSome ? ledgerOpt.unwrap() : null;
    const unlockings = ledger
      ? ledger.unlocking.map((lock) => ({
          amount: new BigNumber(lock.value),
          completionDate: new Date(
            activeEraStart + (lock.era - activeEraIndex) * eraLength
          ), // This is an estimation of the date of completion, since it depends on block validation speed
        }))
      : [];
    const unlocked = unlockings.filter((lock) => lock.completionDate <= now);
    const unlockingBalance = unlockings.reduce(
      (sum, lock) => sum.plus(lock.amount),
      new BigNumber(0)
    );
    const unlockedBalance = unlocked.reduce(
      (sum, lock) => sum.plus(lock.amount),
      new BigNumber(0)
    );
    return {
      controller,
      stash,
      unlockedBalance,
      unlockingBalance,
      unlockings,
    };
  });

/**
 * Returns nominations for an account including validator address, status and associated stake.
 *
 * @param {*} addr
 */
export const getNominations = async (addr: string) =>
  withApi(async (api: typeof ApiPromise) => {
    const [{ activeEra }, nominationsOpt] = await Promise.all([
      api.derive.session.indexes(),
      api.query.staking.nominators(addr),
    ]);
    if (nominationsOpt.isNone) return [];
    const targets = nominationsOpt.unwrap().targets;
    const [exposures, stashes] = await Promise.all([
      api.query.staking.erasStakers.multi(
        targets.map((target) => [activeEra, target])
      ),
      api.derive.staking.stashes(),
    ]);
    const allStashes = stashes.map((stash) => stash.toString());
    return targets.map((target, index) => {
      const exposure = exposures[index];
      const individualExposure = exposure.others.find(
        (o) => o.who.toString() === addr
      );
      const value = individualExposure
        ? new BigNumber(individualExposure.value)
        : new BigNumber(0);
      const status = exposure.others.length
        ? individualExposure
          ? "active"
          : "inactive"
        : allStashes.includes(target.toString())
        ? "waiting"
        : null;
      return {
        address: target.toString(),
        value,
        status,
      };
    });
  });

/**
 * Returns all the params from the chain to build an extrinsic (a transaction on Substrate)
 */
export const getTransactionParams = async () =>
  withApi(async (api: typeof ApiPromise) => {
    const chainName = await api.rpc.system.chain();
    const blockHash = await api.rpc.chain.getFinalizedHead();
    const genesisHash = await api.rpc.chain.getBlockHash(0);
    const { number } = await api.rpc.chain.getHeader(blockHash);
    const { specName, specVersion, transactionVersion } =
      await api.rpc.state.getRuntimeVersion(blockHash);
    return {
      blockHash,
      blockNumber: number,
      genesisHash,
      chainName: chainName.toString(),
      specName: specName.toString(),
      specVersion,
      transactionVersion,
    };
  });

/**
 * Broadcast the transaction to the substrate node
 *
 * @param {string} extrinsic - the encoded extrinsic to send
 */
export const submitExtrinsic = async (extrinsic: string) =>
  withApi(async (api: typeof ApiPromise) => {
    const tx = api.tx(extrinsic);
    const hash = await api.rpc.author.submitExtrinsic(tx);
    return hash;
  });

/**
 * Retrieve the transaction fees and weights
 * Note: fees on Substrate are not set by the signer, but directly by the blockchain runtime.
 *
 * @param {string} extrinsic - the encoded extrinsic to send with a fake signing
 */
export const paymentInfo = async (extrinsic: string) =>
  withApi(async (api: typeof ApiPromise) => {
    const info = await api.rpc.payment.queryInfo(extrinsic);
    return info;
  });

/**
 * Fetch all reward points for validators for current era
 *
 * @returns Map<String, BigNumber>
 */
export const fetchRewardPoints = async () =>
  withApi(async (api: typeof ApiPromise) => {
    const activeOpt = await api.query.staking.activeEra();
    const { index: activeEra } = activeOpt.unwrapOrDefault();
    const { individual } = await api.query.staking.erasRewardPoints(activeEra);
    // recast BTreeMap<AccountId,RewardPoint> to Map<String, RewardPoint> because strict equality does not work
    const rewards = new Map<String, BigNumber>(
      [...individual.entries()].map(([k, v]) => [
        k.toString(),
        new BigNumber(v.toString()),
      ])
    );
    return rewards;
  });

/**
 * @source https://github.com/polkadot-js/api/blob/master/packages/api-derive/src/accounts/info.ts
 */
function dataAsString(data: Data): string {
  return data.isRaw
    ? u8aToString(data.asRaw.toU8a(true)).trim()
    : data.isNone
    ? ""
    : data.toHex();
}

/**
 * Fetch identity name of multiple addresses.
 * Get parent identity if any, and concatenate parent name with child name.
 *
 * @param {string[]} addresses
 */
export const fetchIdentities = async (addresses: string[]) =>
  withApi(async (api: typeof ApiPromise) => {
    const superOfOpts = await api.query.identity.superOf.multi<
      Option<ITuple<[AccountId, Data]>>
    >(addresses);
    const withParent = superOfOpts.map((superOfOpt) =>
      superOfOpt?.isSome ? superOfOpt?.unwrap() : undefined
    );
    const parentAddresses = uniq(
      compact(withParent.map((superOf) => superOf && superOf[0].toString()))
    );
    const [identities, parentIdentities] = await Promise.all([
      api.query.identity.identityOf.multi<Option<Registration>>(addresses),
      api.query.identity.identityOf.multi<Option<Registration>>(
        parentAddresses
      ),
    ]);
    const map = new Map<string, string>(
      addresses.map((addr, index) => {
        const indexOfParent = withParent[index]
          ? parentAddresses.indexOf(withParent[index][0].toString())
          : -1;
        const identityOpt =
          indexOfParent > -1
            ? parentIdentities[indexOfParent]
            : identities[index];

        if (identityOpt.isNone) {
          return [addr, ""];
        }

        const {
          info: { display },
        } = identityOpt.unwrap();
        const name = withParent[index]
          ? `${dataAsString(display)} / ${dataAsString(withParent[index][1])}`
          : dataAsString(display);
        return [addr, name];
      })
    );
    return map;
  });

/**
 * Transforms each validator into an internal Validator type.
 * @param {*} rewards - map of addres sand corresponding reward
 * @param {*} identities - map of address and corresponding identity
 * @param {*} elected - list of elected validator addresses
 * @param {*} maxNominators - constant for oversubscribed validators
 * @param {*} validator - the validator details to transform.
 */
const mapValidator = (
  rewards,
  identities,
  elected,
  maxNominators,
  validator
): PolkadotValidator => {
  const address = validator.accountId.toString();
  return {
    address: address,
    identity: identities.get(address) || "",
    nominatorsCount: validator.exposure.others.length,
    rewardPoints: rewards.get(address) || null,
    commission: new BigNumber(validator.validatorPrefs.commission).dividedBy(
      VALIDATOR_COMISSION_RATIO
    ),
    totalBonded: new BigNumber(validator.exposure.total),
    selfBonded: new BigNumber(validator.exposure.own),
    isElected: elected.includes(address),
    isOversubscribed: validator.exposure.others.length >= maxNominators,
  };
};

/**
 * List all validators for the current era, and their exposure, and identity.
 */
export const getValidators = async (
  stashes: string | string[] = "elected"
): Promise<PolkadotValidator> =>
  withApi(async (api: typeof ApiPromise) => {
    const [allStashes, elected] = await Promise.all([
      api.derive.staking.stashes(),
      api.query.session.validators(),
    ]);
    let stashIds;
    const allIds = allStashes.map((s) => s.toString());
    const electedIds = elected.map((s) => s.toString());

    if (Array.isArray(stashes)) {
      stashIds = allIds.filter((s) => stashes.includes(s));
    } else if (stashes === "elected") {
      stashIds = electedIds;
    } else {
      const waitingIds = allIds.filter((v) => !electedIds.includes(v));

      if (stashes === "waiting") {
        stashIds = waitingIds;
      } else {
        // Keep elected in first positions
        stashIds = [...electedIds, ...waitingIds];
      }
    }

    const [validators, rewards, identities] = await Promise.all([
      api.derive.staking.accounts(stashIds),
      fetchRewardPoints(),
      fetchIdentities(stashIds),
    ]);
    return validators.map(
      mapValidator.bind(
        null,
        rewards,
        identities,
        electedIds,
        api.consts.staking.maxNominatorRewardedPerValidator
      )
    );
  });

/**
 * Get Active Era progress
 */
export const getStakingProgress = async (): Promise<PolkadotStakingProgress> =>
  withApi(async (api: typeof ApiPromise) => {
    const [activeEraOpt, status] = await Promise.all([
      api.query.staking.activeEra(),
      api.query.staking.eraElectionStatus(),
    ]);
    const { index: activeEra } = activeEraOpt.unwrapOrDefault();
    return {
      activeEra: activeEra.toNumber(),
      electionClosed: !!status.isClose,
    };
  });

/**
 * Return TypeRegistry and decorated extrinsics from client
 */
export const getRegistry = async () =>
  withApi(async (api: typeof ApiPromise) => {
    return {
      registry: api.registry,
      extrinsics: api.tx,
    };
  });
