import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import { isElectionClosed } from "./sidecar";
import { bittensorRuntimeSpec } from "./sidecar.fixture";

const makeCurrency = (id: string): CryptoCurrency =>
  ({
    id,
    type: "CryptoCurrency",
    name: id,
    managerAppName: id,
    ticker: id.toUpperCase(),
    scheme: id,
    color: "#000000",
    family: "polkadot",
    coinType: 434,
    units: [{ name: id, code: id.toUpperCase(), magnitude: 9 }],
    explorerViews: [],
  }) as unknown as CryptoCurrency;

const BITTENSOR_SIDECAR_URL = "https://bittensor-sidecar.test.ledger.com";

describe("bittensorRuntimeSpec fixture", () => {
  it("has specName node-subtensor", () => {
    expect(bittensorRuntimeSpec.specName).toBe("node-subtensor");
  });

  it("has ss58Format 42", () => {
    expect(bittensorRuntimeSpec.properties.ss58Format).toBe("42");
  });

  it("has tokenSymbol TAO", () => {
    expect(bittensorRuntimeSpec.properties.tokenSymbol).toBe("TAO");
  });

  it("has tokenDecimals 9", () => {
    expect(bittensorRuntimeSpec.properties.tokenDecimals).toBe("9");
  });
});

describe("isElectionClosed for bittensor", () => {
  beforeEach(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      sidecar: { url: BITTENSOR_SIDECAR_URL },
      node: { url: "" },
      indexer: { url: "" },
    }));
  });

  it("returns true for bittensor without hitting sidecar (in UNSUPPORTED_STAKING_NETWORKS)", async () => {
    const bittensor = makeCurrency("bittensor");
    const result = await isElectionClosed(bittensor);
    expect(result).toBe(true);
  });
});

describe("UNSUPPORTED_STAKING_NETWORKS includes bittensor", () => {
  it("isElectionClosed resolves to true for bittensor synchronously (no network call)", async () => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      sidecar: { url: BITTENSOR_SIDECAR_URL },
      node: { url: "" },
      indexer: { url: "" },
    }));

    const bittensor = makeCurrency("bittensor");
    const polkadot = makeCurrency("polkadot");
    const westend = makeCurrency("westend");

    const [bittensorResult, polkadotResult, westendResult] = await Promise.all([
      isElectionClosed(bittensor),
      isElectionClosed(polkadot),
      isElectionClosed(westend),
    ]);

    expect(bittensorResult).toBe(true);
    expect(polkadotResult).toBe(true);
    expect(westendResult).toBe(true);
  });
});
