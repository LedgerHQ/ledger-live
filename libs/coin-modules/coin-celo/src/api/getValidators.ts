import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import { getValidatorGroups } from "../network/hubble";

/**
 * Lists the Celo validator **groups** available to vote for, mapped to the
 * framework `Validator` type. Celo delegates staking to validator groups (not
 * individual validators), so a group is the votable unit here.
 *
 * The underlying `getValidatorGroups` already merges the indexer list with
 * on-chain eligibility/capacity and returns a single, fully-ordered set, so all
 * groups are returned in one page (no cursor). `commissionRate`/`apy` are omitted
 * — Celo does not surface per-group values through this path.
 */
export const getValidators = async (_cursor?: Cursor): Promise<Page<Validator>> => {
  const groups = await getValidatorGroups();

  const items: Validator[] = groups.map(group => ({
    address: group.address,
    name: group.name,
    balance: BigInt(group.votes.toFixed(0)),
  }));

  return { items, next: undefined };
};

export default getValidators;
