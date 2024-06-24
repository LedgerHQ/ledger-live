import { DeriveStakingQuery } from "@polkadot/api-derive/types";
import { EraIndex, RewardPoint } from "@polkadot/types/interfaces";
import {
  SidecarValidators,
  SidecarValidatorsParamAddresses,
  SidecarValidatorsParamStatus,
  IValidator,
  IIdentity,
} from "../sidecar.types";
import getApiPromise from "./apiPromise";
import { multiIdentities } from "./identities";
import { ApiPromise } from "@polkadot/api";

const QUERY_OPTS = {
  withExposure: true,
  withLedger: true,
  withPrefs: true,
};

/**
 * Fetch a list of validators with some info and indentity.
 * It fetches the list providing a status (all, elected, waiting) and/or a list of
 * addresses (comma-separated or as multiple query params).
 *
 * @async
 * @param {string} status
 * @param {string[]} addresses
 *
 * @returns {SidecarValidators}
 */
export const fetchValidators = async (
  status: SidecarValidatorsParamStatus = "all",
  addresses?: SidecarValidatorsParamAddresses,
): Promise<SidecarValidators> => {
  const api = await getApiPromise();

  const [activeOpt, allStashes, elected, nextElected] = await Promise.all([
    api.query.staking.activeEra(),
    api.derive.staking.stashes(),
    api.query.session.validators(),
    api.derive.staking.nextElected(),
  ]);

  const { index: activeEra } = activeOpt.unwrapOrDefault();

  const rewards = await fetchRewardsPoints(api)(activeEra);

  let selected: string[] = [];
  const allIds = allStashes.map(s => s.toString());
  const electedIds = elected.map(s => s.toString());

  switch (status) {
    case "elected":
      selected = electedIds;
      break;
    case "waiting": {
      const waitingIds = allIds.filter(v => !electedIds.includes(v));
      selected = waitingIds;
      break;
    }
    case "nextElected":
      selected = nextElected.map(s => s.toString());
      break;
    case "all": {
      const waitingIds = allIds.filter(v => !electedIds.includes(v));
      // Keep order of elected validators
      selected = [...electedIds, ...waitingIds];
      break;
    }
    default:
      throw new Error(`Status ${status} is unknown`);
  }

  if (addresses) {
    selected = addresses
      .map(a => a.toString())
      .filter(address => selected.includes(address.toString()));
  }

  const [validators, identities] = await Promise.all([
    api.derive.staking.queryMulti(selected, QUERY_OPTS),
    multiIdentities(selected),
  ]);

  return validators.map((validator, index) =>
    formatValidator(api)(validator, identities[index], rewards, electedIds),
  );
};

const fetchRewardsPoints =
  (api: ApiPromise) =>
  async (activeEra: EraIndex): Promise<Map<string, RewardPoint>> => {
    const { individual } = await api.query.staking.erasRewardPoints(activeEra);

    // recast BTreeMap<AccountId,RewardPoint> to Map<String, RewardPoint> because strict equality does not work
    const rewards = new Map<string, RewardPoint>(
      [...individual.entries()].map(([k, v]) => [k.toString(), v]),
    );

    return rewards;
  };

const formatValidator =
  (api: ApiPromise) =>
  (
    validator: DeriveStakingQuery,
    identity: IIdentity,
    rewards: Map<string, RewardPoint>,
    electedIds: string[],
  ): IValidator => {
    const validatorId = validator.accountId.toString();
    const maxNominatorRewardedPerValidator = api.consts?.staking?.maxNominatorRewardedPerValidator;

    return {
      accountId: validator.accountId.toString(),
      identity,
      // own: validator.exposure.own.toString(),
      own: validator.exposureEraStakers.own.toString(),
      // total: validator.exposure.total.toString(),
      total: validator.exposureEraStakers.total.toString(),
      // nominatorsCount: validator.exposure.others.length,
      nominatorsCount: validator.exposureEraStakers.others.length,
      commission: validator.validatorPrefs.commission.toString(),
      rewardsPoints: rewards.get(validatorId)?.toString() || null,
      isElected: electedIds.includes(validatorId),
      isOversubscribed: maxNominatorRewardedPerValidator
        ? validator.exposureEraStakers.others.length > Number(maxNominatorRewardedPerValidator)
        : false,
    };
  };
