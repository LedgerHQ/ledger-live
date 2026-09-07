import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { apiClient } from "../network/api";
import { estimateNetRate, isRecord, parseTotalSupply, resolveConfig } from "./utils";
import type {
  AleoCommitteeMember,
  AleoCommitteeResponse,
  AleoValidatorMetadataResponse,
} from "../types/api";
import type { AleoValidator } from "../types";

// Short enough that a validator that has just closed is not offered for long.
const VALIDATORS_CACHE = minutes(5, 2);

const isStakeMicrocredits = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isCommissionPercent = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;

function isValidCommitteeMember(value: unknown): value is AleoCommitteeMember {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    isStakeMicrocredits(value[0]) &&
    typeof value[1] === "boolean" &&
    isCommissionPercent(value[2])
  );
}

function isValidCommitteeResponse(value: unknown): value is AleoCommitteeResponse {
  if (!isRecord(value)) return false;
  // The protocol always has a committee, so absent `members` is an error envelope
  // rather than an empty list — accepting it would cache emptiness for a whole TTL.
  if (!isRecord(value.members)) return false;

  return Object.values(value.members).every(isValidCommitteeMember);
}

function isValidValidatorMetadataResponse(value: unknown): value is AleoValidatorMetadataResponse {
  if (!isRecord(value)) return false;

  return Object.values(value).every(entry => typeof entry === "string");
}

/**
 * The validator committee for `currencyId`'s configured network, ordered for a picker.
 *
 * Only the committee is required. Names and total supply are best-effort, so losing
 * either degrades a field rather than failing the list the bond flow depends on.
 */
export const getValidators = makeLRUCache(
  async (currencyId: string): Promise<AleoValidator[]> => {
    const config = resolveConfig(currencyId);

    const [committee, metadata, totalSupply] = await Promise.all([
      apiClient.getCommittee(config),
      apiClient.getValidatorMetadata(config).catch(() => null),
      apiClient.getTotalSupply(config).catch(() => null),
    ]);

    if (!isValidCommitteeResponse(committee)) {
      throw new Error("Unable to fetch Aleo validators: invalid committee response");
    }

    const safeMetadata = metadata && isValidValidatorMetadataResponse(metadata) ? metadata : {};

    const totalSupplyCredits = parseTotalSupply(totalSupply);
    const totalStakeMicrocredits =
      committee.total_stake === undefined ? null : new BigNumber(committee.total_stake);

    if (totalSupplyCredits === null || totalStakeMicrocredits === null) {
      log("aleo/getValidators", "no estimated rate: missing total supply or total stake", {
        hasTotalSupply: totalSupplyCredits !== null,
        hasTotalStake: totalStakeMicrocredits !== null,
      });
    }

    return Object.entries(committee.members)
      .map(([address, [stakeMicrocredits, isOpen, commissionPercent]]) => {
        const rate =
          totalSupplyCredits === null || totalStakeMicrocredits === null
            ? null
            : estimateNetRate({
                totalSupplyCredits,
                totalStakeMicrocredits,
                validatorStakeMicrocredits: new BigNumber(stakeMicrocredits),
                commissionPercent: new BigNumber(commissionPercent),
              });

        return {
          address,
          name: safeMetadata[address],
          stakeMicrocredits,
          isOpen,
          commissionPercent,
          ...(rate !== null && { estimatedYearlyRewardsRate: rate.toNumber() }),
        };
      })
      .sort((left, right) => {
        if (left.isOpen !== right.isOpen) {
          return left.isOpen ? -1 : 1;
        }

        return right.stakeMicrocredits - left.stakeMicrocredits;
      });
  },
  currencyId => currencyId,
  VALIDATORS_CACHE,
);
