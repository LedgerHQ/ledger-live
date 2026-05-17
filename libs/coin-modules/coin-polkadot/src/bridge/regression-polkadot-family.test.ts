import { isValidAddress } from "../common";
import coinConfig from "../config";
import type { PolkadotCoinConfig } from "../config";
import { validateAddress } from "../logic/validateAddress";

const makeTestConfig = (): PolkadotCoinConfig => ({
  status: { type: "active" },
  sidecar: { url: "https://sidecar.test" },
  node: { url: "https://node.test" },
  indexer: { url: "https://indexer.test" },
  staking: { electionStatusThreshold: 25 },
});

const CURRENCIES = ["polkadot", "assethub_polkadot", "westend", "assethub_westend", "bittensor"];

describe("config resolution — all polkadot-family currencies", () => {
  beforeEach(() => {
    coinConfig.setCoinConfig(() => makeTestConfig());
  });

  it.each(CURRENCIES)("getCoinConfig(%s) resolves without throwing", currencyId => {
    expect(() => coinConfig.getCoinConfig(currencyId)).not.toThrow();
  });

  it.each(CURRENCIES)("getCoinConfig(%s) returns sidecar url", currencyId => {
    const config = coinConfig.getCoinConfig(currencyId);
    expect(config.sidecar.url).toBe("https://sidecar.test");
  });

  it.each(CURRENCIES)("getCoinConfig(%s) returns node url", currencyId => {
    const config = coinConfig.getCoinConfig(currencyId);
    expect(config.node.url).toBe("https://node.test");
  });

  it.each(CURRENCIES)("getCoinConfig(%s) returns indexer url", currencyId => {
    const config = coinConfig.getCoinConfig(currencyId);
    expect(config.indexer.url).toBe("https://indexer.test");
  });
});

describe("address validation — ss58 format correctness", () => {
  // A valid Polkadot address (ss58=0)
  const POLKADOT_ADDRESS = "16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV";

  // A valid generic Substrate address (ss58=42), compatible with Bittensor/Westend
  // Generated from the same public key with prefix 42
  const SUBSTRATE_ADDRESS_42 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  it("polkadot address (ss58=0) is valid with default ss58 prefix", () => {
    expect(isValidAddress(POLKADOT_ADDRESS)).toBe(true);
  });

  it("substrate ss58=42 address is valid with ss58Format=42", () => {
    expect(isValidAddress(SUBSTRATE_ADDRESS_42, 42)).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isValidAddress("")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidAddress(undefined)).toBe(false);
  });

  it("returns false for malformed address", () => {
    expect(isValidAddress("notanaddress")).toBe(false);
  });
});

describe("validateAddress — currency-aware ss58 routing", () => {
  it("polkadot uses ss58=0 — accepts polkadot address", async () => {
    const POLKADOT_ADDRESS = "16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV";
    const result = await validateAddress(POLKADOT_ADDRESS, { currencyId: "polkadot" });
    expect(result).toBe(true);
  });

  it("bittensor uses ss58=42 — accepts generic substrate address", async () => {
    const SUBSTRATE_ADDRESS_42 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    const result = await validateAddress(SUBSTRATE_ADDRESS_42, { currencyId: "bittensor" });
    expect(result).toBe(true);
  });

  it("westend uses ss58=42 — accepts generic substrate address", async () => {
    const SUBSTRATE_ADDRESS_42 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    const result = await validateAddress(SUBSTRATE_ADDRESS_42, { currencyId: "westend" });
    expect(result).toBe(true);
  });

  it("returns false for malformed address regardless of currency", async () => {
    const result = await validateAddress("notanaddress", { currencyId: "bittensor" });
    expect(result).toBe(false);
  });

  it("assethub_polkadot uses ss58=0 — accepts polkadot address", async () => {
    const POLKADOT_ADDRESS = "16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV";
    const result = await validateAddress(POLKADOT_ADDRESS, { currencyId: "assethub_polkadot" });
    expect(result).toBe(true);
  });

  it("assethub_westend uses ss58=42 — accepts generic substrate address", async () => {
    const SUBSTRATE_ADDRESS_42 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    const result = await validateAddress(SUBSTRATE_ADDRESS_42, { currencyId: "assethub_westend" });
    expect(result).toBe(true);
  });
});
