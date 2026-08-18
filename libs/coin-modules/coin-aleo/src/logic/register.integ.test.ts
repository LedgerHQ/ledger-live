import aleoConfig from "../config";
import { testnetViewKey } from "../__tests__/fixtures/api.fixture";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import { getPristineAccount } from "../__tests__/helpers/account";
import { register } from "./register";

describe("register", () => {
  const config = getTestnetIntegConfig();

  beforeAll(() => {
    aleoConfig.setCoinConfig(() => config);
  });

  it("enrolls a view key into the testnet scanner and returns an aleo handle", async () => {
    const result = await register(config, testnetViewKey);

    expect(result.type).toBe("aleo");
    expect(typeof result.provableId).toBe("string");
    expect(result.provableId.length).toBeGreaterThan(0);
  });

  it("can register the same view key twice and returns an aleo handle for both calls", async () => {
    const first = await register(config, testnetViewKey);
    const second = await register(config, testnetViewKey);

    expect(first.type).toBe("aleo");
    expect(typeof first.provableId).toBe("string");
    expect(first.provableId.length).toBeGreaterThan(0);
    expect(second.type).toBe("aleo");
    expect(typeof second.provableId).toBe("string");
    expect(second.provableId.length).toBeGreaterThan(0);
  });

  it("gives distinct view keys distinct handles", async () => {
    const pristine = await getPristineAccount();

    const [known, fresh] = await Promise.all([
      register(config, testnetViewKey),
      register(config, pristine.viewKey),
    ]);

    expect(fresh.provableId).not.toBe(known.provableId);
  });

  it("rejects an empty view key before hitting the network", async () => {
    await expect(register(config, "")).rejects.toThrow(/view key is required/);
  });
});
