export type GetEarnPositionsArgs = {
  network: string;
  address: string;
  /** Sets the `fresh` flag of the request. Cached apart from the plain read. */
  fresh?: boolean;
};
