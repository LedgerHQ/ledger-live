import { DeriveStakingQuery } from "@polkadot/api-derive/types";
import { EraIndex } from "@polkadot/types/interfaces";
import {
  SidecarValidators,
  SidecarValidatorsParamAddresses,
  SidecarValidatorsParamStatus,
  IValidator,
} from "../sidecar.types";
import getApiPromise from "./apiPromise";
import { ApiPromise } from "@polkadot/api";
import type { SpStakingPagedExposureMetadata } from "@polkadot/types/lookup";

const QUERY_OPTS = {
  withExposure: false,
  withLedger: false,
  withPrefs: false,
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
  const validators = await api.derive.staking.queryMulti(selected, QUERY_OPTS);
  const validatorsCommissions = await getValidatorCommissions(api, selected);
  const validatorsExposure = await getValidatorsExposure(api, activeEra, selected);
  const maxNominatorRewardedPerValidator = api.consts?.staking?.maxExposurePageSize.toNumber();
  return validators.map(validator => {
    const commission = validatorsCommissions[validator.accountId.toString()] || "";
    const exposure = validatorsExposure[validator.accountId.toString()] || null;
    return formatValidator(
      validator,
      electedIds,
      commission,
      exposure,
      maxNominatorRewardedPerValidator,
    );
  });
};

const formatValidator = (
  validator: DeriveStakingQuery,
  electedIds: string[],
  commission: string,
  exposure: SpStakingPagedExposureMetadata | null,
  maxNominatorRewardedPerValidator: number,
): IValidator => {
  const validatorId = validator.accountId.toString();
  return {
    accountId: validator.accountId.toString(),
    identity: null,
    own: exposure?.own?.toString() ?? "0",
    total: exposure?.total?.toString() ?? "0",
    nominatorsCount: exposure?.nominatorCount?.toNumber() ?? 0,
    commission,
    rewardsPoints: null,
    isElected: electedIds.includes(validatorId),
    isOversubscribed: maxNominatorRewardedPerValidator
      ? validator.exposureEraStakers.others.length > Number(maxNominatorRewardedPerValidator)
      : false,
  };
};

async function getValidatorCommissions(
  api: ApiPromise,
  electedIds: string[],
): Promise<{ [key: string]: string }> {
  const validatorInfos = await api.query.staking.validators.multi(electedIds);
  const commissions: { [key: string]: string } = {};
  electedIds.forEach((address, index) => {
    const validatorInfo = validatorInfos[index];
    const commission = validatorInfo.commission.toString();
    commissions[address] = commission;
  });
  return commissions;
}

async function getValidatorsExposure(
  api: ApiPromise,
  activeEra: EraIndex,
  electedIds: string[],
): Promise<{ [key: string]: SpStakingPagedExposureMetadata }> {
  const queries = electedIds.map(id => [activeEra, id]);
  const exposures = await api.query.staking.erasStakersOverview.multi(queries);
  const exposureMap: { [key: string]: SpStakingPagedExposureMetadata } = {};
  exposures.forEach((exposure, index) => {
    if (exposure.isSome) {
      exposureMap[electedIds[index]] = exposure.unwrap();
    }
  });
  return exposureMap;
}
