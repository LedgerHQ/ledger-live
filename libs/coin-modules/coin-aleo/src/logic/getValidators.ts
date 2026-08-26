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
// One entry per network: mainnet, with headroom for testnet alongside it.
const VALIDATORS_CACHE = minutes(5, 2);

// Defensive runtime guards for untrusted JSON coming from the committee API.
// coin-aleo does not depend on a schema-validation library, so we mirror the
// parsing style used for other raw API payloads (see getStakingPosition.ts).
function isValidCommitteeMember(value: unknown): value is AleoCommitteeMember {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === "number" &&
    typeof value[1] === "boolean" &&
    typeof value[2] === "number"
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
 * Fetches the current Aleo validator committee (and, best-effort, their display
 * names and estimated rates) for the network the given currency is configured
 * for (mainnet or testnet), so bonding never targets validators from the wrong
 * network.
 *
 * Only the committee is required. Names and total supply are fetched
 * best-effort: losing either degrades a field (address instead of a name, no
 * rate) rather than failing the list the bond flow depends on.
 */
export const getValidators = makeLRUCache(
  async (currencyId: string): Promise<AleoValidator[]> => {
    const config = resolveConfig(currencyId);

    // Independent reads — serialising them would trible the picker's cold-open latency.
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
      // Not fatal, but it silently strips the rate from every row — worth a trace
      // when the picker unexpectedly shows no rates.
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
          // Omit the key entirely rather than setting it to undefined: the field is
          // optional and the package runs with exactOptionalPropertyTypes.
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
