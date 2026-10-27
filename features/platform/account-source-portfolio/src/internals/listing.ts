import type { Portfolio } from "@domain/api-account-portfolio";

/** Past this age, a listing may miss a network the service fanned out to since. */
export const LISTING_MAX_AGE = 60_000;

type Listing = { portfolio: Portfolio; at: number } | undefined;

export const isFreshListing = (listing: Listing): listing is NonNullable<Listing> =>
  listing !== undefined && Date.now() - listing.at < LISTING_MAX_AGE;
