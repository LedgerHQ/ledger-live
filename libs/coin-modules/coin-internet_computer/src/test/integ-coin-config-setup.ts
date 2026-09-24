import coinConfig from "../config";

// Integration suites run against the production Internet Computer gateway.
coinConfig.setCoinConfig(() => ({
  status: { type: "active" },
  infra: { ICP_NETWORK_URL: "https://ic0.app" },
}));
