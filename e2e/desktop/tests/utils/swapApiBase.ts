/** Shared by the test runner and the launched app so both call the same swap backend. */
export const SWAP_API_BASE =
  process.env.SWAP_API_BASE || "https://global.api.stg.ledger-test.com/swap/v5";
