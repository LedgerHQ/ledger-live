import network from "@ledgerhq/live-network";
import { getCoinConfig } from "../config";

export type ValidatorInfo = {
  address: string;
  validatorLogo: string | undefined;
  identityName: string;
  description: string | undefined;
  website: string | undefined;
  stake: number;
  delegations: number;
  blocksCreated: number;
  name: string;
  fee: number;
  delegatorsCount: number;
};

export type ValidatorInfoFromAPI = {
  validatorAddress: string;
  validatorName: string;
  validatorFee: number;
  delegatorsCount: number;
  terms?: string;
  additionalTerms?: string;
  stake: number;
  nextEpochStake: number;
  nextEpochDelegationsCount: number;
  stakePercent: number;
  networkShare: number;
  canonicalBlocksCount: number;
  allBlocksCount: number;
  isVerified: boolean;
  isActive: boolean;
  diffStake: number;
  diffDelegatorsCount: number;
  socialDiscord?: string;
  discordNicknames?: string;
  socialTelegram?: string;
  socialTwitter?: string;
  socialEmail?: string;
  socialGitHub?: string;
  website?: string;
  validatorImg?: string;
  description?: string;
  isStakingRewardsVerified?: boolean;
  stakingRewardsSlug?: string;
};

export type GetValidatorsResponse = {
  content: ValidatorInfoFromAPI[];
  pageable: {
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
};

const getBlockberryUrl = (): string => {
  const currencyConfig = getCoinConfig();
  return `${currencyConfig.infra.API_VALIDATORS_BASE_URL}`;
};

export const fetchValidators = async (): Promise<ValidatorInfo[]> => {
  const validators: ValidatorInfoFromAPI[] = [];

  let currentPage = 0;
  let hasMore = true;

  while (hasMore) {
    const baseUrl = `${getBlockberryUrl()}`;
    const { data } = await network<GetValidatorsResponse>({
      method: "GET",
      url: `${baseUrl}?page=${currentPage}&size=50&orderBy=DESC&sortBy=DELEGATORS&type=ACTIVE&isVerifiedOnly=true`,
    });

    validators.push(...data.content);
    hasMore = !data.last;
    currentPage++;
  }

  return validators.map(validator => ({
    address: validator.validatorAddress,
    name: validator.validatorName,
    fee: validator.validatorFee,
    delegatorsCount: validator.delegatorsCount,
    validatorLogo: validator.validatorImg,
    identityName: validator.validatorName,
    description: validator.description,
    website: validator.website,
    stake: validator.stake,
    delegations: validator.nextEpochDelegationsCount,
    blocksCreated: validator.canonicalBlocksCount,
  }));
};
