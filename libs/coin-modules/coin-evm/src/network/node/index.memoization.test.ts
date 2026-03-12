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

  function mkConf(node: { type: string; uri: string; retries: number }): EvmCoinConfig {
    return { info: { node } } as unknown as EvmCoinConfig;
  }
  it("should return different NodeApi instances for different retries", () => {
    const currency = { id: "ethereum" } as any;
    const nodeConf1 = { type: "external", uri: "u", retries: 2 };
    setCoinConfig(() => mkConf(nodeConf1));
    const node1 = getNodeApi(currency);

    const nodeConf2 = { ...nodeConf1, retries: 5 };
    setCoinConfig(() => mkConf(nodeConf2));

    const node2 = getNodeApi(currency);
    expect(node1).not.toBe(node2);
  });

  it("should return different NodeApi instances for different uris", () => {
    const currency = { id: "ethereum" } as any;
    const nodeConf1 = { type: "external", uri: "u1", retries: 2 };
    setCoinConfig(() => mkConf(nodeConf1));
    const node1 = getNodeApi(currency);

    const nodeConf2 = { ...nodeConf1, uri: "u2" };
    setCoinConfig(() => mkConf(nodeConf2));
    const node2 = getNodeApi(currency);

    expect(node1).not.toBe(node2);
  });

  it("should return different NodeApi instances for different currencies", () => {
    const conf = mkConf({ type: "external", uri: "u1", retries: 2 });
    setCoinConfig(() => conf);

    const currency1 = { id: "ethereum1" } as any;
    const node1 = getNodeApi(currency1);

    const currency2 = { id: "ethereum2" } as any;
    const node2 = getNodeApi(currency2);

    expect(node1).not.toBe(node2);
  });
});
