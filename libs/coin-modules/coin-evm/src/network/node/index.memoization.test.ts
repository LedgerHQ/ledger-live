import { EvmCoinConfig, setCoinConfig } from "../../config";
import { getNodeApi } from "./index";

const externalNodeConfig = (): EvmCoinConfig =>
  ({ info: { node: { type: "external", uri: "working" } } }) as unknown as EvmCoinConfig;

describe("getNodeApi memoization", () => {
  it("should return the same NodeApi instance for same currency and retries (memoization)", () => {
    setCoinConfig(externalNodeConfig);

    const currency = { id: "ethereum" } as any;
    const node1 = getNodeApi(currency);
    const node2 = getNodeApi(currency);

    expect(node1).toBe(node2);
  });

  it("should return cached NodeApi on subsequent calls (createNodeApi called once)", () => {
    setCoinConfig(externalNodeConfig);

    const currency = { id: "cached_value_test" } as any;
    const cachedInstance = getNodeApi(currency);
    const second = getNodeApi(currency);
    const third = getNodeApi(currency);

    expect(second).toBe(cachedInstance);
    expect(third).toBe(cachedInstance);
  });

  it("should return different NodeApi instances for different retries", () => {
    const currency = { id: "ethereum" } as any;
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "external", uri: "u", retries: 2 } },
        }) as unknown as EvmCoinConfig,
    );
    const node1 = getNodeApi(currency);
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "external", uri: "u", retries: 5 } },
        }) as unknown as EvmCoinConfig,
    );
    const node2 = getNodeApi(currency);

    expect(node1).not.toBe(node2);
  });
});
