import type { ApyFraction } from "@domain/entity-earn-position";
import type { SolanaValidatorApyByVoteAccount } from "./types";

/**
 * The APY of one validator, for the `selectFromResult` option of `useGetSolanaValidatorApyQuery`:
 * the component then renders again only when that APY changes. Undefined for an empty vote account
 * or a validator the lookup does not list.
 */
export function selectSolanaValidatorApy(
  apyByVoteAccount: SolanaValidatorApyByVoteAccount | undefined,
  voteAccount: string | undefined,
): ApyFraction | undefined {
  if (!apyByVoteAccount || !voteAccount || !Object.hasOwn(apyByVoteAccount, voteAccount)) {
    return undefined;
  }
  return apyByVoteAccount[voteAccount];
}
