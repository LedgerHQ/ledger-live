import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { isDefaultValidatorGroup } from "../logic";
import { CeloValidatorGroup } from "../types/types";
const getUrl = (route: string): string => `${getEnv("API_CELO_INDEXER")}${route || ""}`;

const fetchValidatorGroups = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/validator_groups`),
  });
  return data.items;
};

export const getValidatorGroups = async (): Promise<CeloValidatorGroup[]> => {
  const validatorGroups = await fetchValidatorGroups();

  const result = validatorGroups.map(
    (validatorGroup: {
      address: string;
      name: string;
      active_votes: BigNumber.Value;
      pending_votes: BigNumber.Value;
    }) => ({
      address: validatorGroup.address,
      name: validatorGroup.name || validatorGroup.address,
      votes: new BigNumber(validatorGroup.active_votes).plus(
        new BigNumber(validatorGroup.pending_votes),
      ),
    }),
  );
  return customValidatorGroupsOrder(result);
};

const customValidatorGroupsOrder = (validatorGroups: any[]): CeloValidatorGroup[] => {
  const defaultValidatorGroup = validatorGroups.find(isDefaultValidatorGroup);

  const sortedValidatorGroups = [...validatorGroups]
    .sort((a, b) => b.votes.minus(a.votes))
    .filter(group => !isDefaultValidatorGroup(group));

  return defaultValidatorGroup
    ? [defaultValidatorGroup, ...sortedValidatorGroups]
    : sortedValidatorGroups;
};
