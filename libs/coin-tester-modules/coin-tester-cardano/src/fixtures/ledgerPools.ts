// Static captures of the real Ledger Cardano proxy responses that `getValidators` consumes
// (`/v1/pool/list` + the epoch-params endpoint). Yaci has no pool-list endpoint, so the adapter serves
// these fixtures — keeping the integ suite hermetic (no live Ledger dependency) while exercising
// getValidators against real-shaped data. Captured 2026-06-05 from
// https://cardano.coin.ledger.com/api/v1/pool/list and https://ada.api.live.ledger.com/api/rest/params.

export const POOL_LIST_PAGE = {
  pageNo: 1,
  limit: 10,
  count: 2926,
  pools: [
    {
      poolId: "bb285eb816215e1fb3473726ab446df4809cd08ac54643a7c1798a13",
      margin: "100.00",
      cost: "340000000",
      pledge: "73000000000000",
      liveStake: "74000000000000",
    },
    {
      poolId: "00000036d515e12e18cd3c88c74f09a67984c2c279a5296aa96efe89",
      margin: "2.00",
      cost: "170000000",
      pledge: "1000000000000",
      liveStake: "23000000000000",
    },
    {
      poolId: "000000d4d72bd00f578ddc73a36a814fbf5f2a3a3b0f1b3d3b0a0b0c",
      margin: "1.50",
      cost: "340000000",
      pledge: "500000000000",
      liveStake: "9000000000000",
    },
  ],
};

// /v1/pool/detail returns the same StakePool shape for the queried ids.
export const POOL_DETAIL = { pools: POOL_LIST_PAGE.pools };

// Epoch params (APY inputs). reserves/activeStake are absent on this endpoint → APY left undefined,
// which getValidators tolerates.
export const EPOCH_PARAMS = {
  cardano: [{ currentEpoch: { number: 635, protocolParams: { a0: 0.3, rho: 0.003, tau: 0.2 } } }],
};
