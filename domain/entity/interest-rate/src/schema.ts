/** An interest rate attached to one currency. */
export interface InterestRate {
  /** Currency identifier */
  currencyId: string;
  /** Interest rate value */
  rate: number;
  /** Type of rate (NRR, APR, APY, etc.) */
  type: string;
  /** Timestamp when the rate was fetched */
  fetchAt: string;
}
