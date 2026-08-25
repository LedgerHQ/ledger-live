import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { apiClient } from "../network/api";
import { resolveConfig } from "./utils";
import type {
  AleoCommitteeMember,
  AleoCommitteeResponse,
  AleoValidatorMetadataResponse,
} from "../types/api";
import type { AleoValidator } from "../types";

// Validator/committee membership changes infrequently relative to how often
// getValidators is called (every debounced BOND_PUBLIC status recompute, plus
// every validator-picker modal mount), so a short cache avoids redundant
// network calls without noticeably staling the data shown to the user.
// One entry per network, with headroom for testnet alongside mainnet.
const VALIDATORS_CACHE = minutes(5, 20);

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

export function isValidCommitteeResponse(value: unknown): value is AleoCommitteeResponse {
  if (typeof value !== "object" || value === null) return false;
  const { members } = value as { members?: unknown };
  if (members === undefined) return true;
  if (typeof members !== "object" || members === null) return false;

  return Object.values(members).every(isValidCommitteeMember);
}

export function isValidValidatorMetadataResponse(
  value: unknown,
): value is AleoValidatorMetadataResponse {
  if (typeof value !== "object" || value === null) return false;

  return Object.values(value).every(entry => typeof entry === "string");
}

/**
 * Fetches the current Aleo validator committee (and, best-effort, their
 * display names) for the network the given currency is configured for
 * (mainnet or testnet), so bonding never targets validators from the wrong
 * network.
 */
export const getValidators = makeLRUCache(
  async (currencyId: string): Promise<AleoValidator[]> => {
    const config = resolveConfig(currencyId);
    const committee = await apiClient.getCommittee(config);

    if (!isValidCommitteeResponse(committee)) {
      throw new Error("Unable to fetch Aleo validators: invalid committee response");
    }

    const metadata = await apiClient.getValidatorMetadata(config).catch(() => null);
    const safeMetadata = metadata && isValidValidatorMetadataResponse(metadata) ? metadata : {};

    return Object.entries(committee.members ?? {})
      .map(([address, [stake, isOpen, commission]]) => ({
        address,
        name: safeMetadata[address],
        stake,
        isOpen,
        commission,
      }))
      .sort((left, right) => {
        if (left.isOpen !== right.isOpen) {
          return left.isOpen ? -1 : 1;
        }

        return right.stake - left.stake;
      });
  },
  currencyId => currencyId,
  VALIDATORS_CACHE,
);
