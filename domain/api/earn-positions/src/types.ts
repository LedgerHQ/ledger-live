import type { ApyFraction } from "@domain/entity-earn-position";

export type GetEarnPositionsArgs = {
  network: string;
  address: string;
  /** Sets the `fresh` flag of the request. Cached apart from the plain read. */
  fresh?: boolean;
};

/** Each validator's APY as a fraction, by the validator's vote account. */
export type SolanaValidatorApyByVoteAccount = Readonly<Record<string, ApyFraction>>;
