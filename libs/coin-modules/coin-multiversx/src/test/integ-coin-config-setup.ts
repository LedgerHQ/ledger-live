import coinConfig from "../config";

// Integration suites run against the production MultiversX APIs.
coinConfig.setCoinConfig(() => ({
  status: { type: "active" },
  infra: {
    MULTIVERSX_API_ENDPOINT: "https://elrond.coin.ledger.com",
    MULTIVERSX_DELEGATION_API_ENDPOINT: "https://delegations-elrond.coin.ledger.com",
  },
}));
