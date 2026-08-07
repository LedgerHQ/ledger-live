import { EvmConfigInfo } from "../../config";
import { getNodeApi } from "./index";

const externalNodeConfig = (): EvmConfigInfo =>
  ({ node: { type: "external", uri: "working" } }) as unknown as EvmConfigInfo;

describe("getNodeApi memoization", () => {
  it("should return the same NodeApi instance for same currency and retries (memoization)", () => {
    const currency = { id: "ethereum" } as any;
    const node1 = getNodeApi(externalNodeConfig(), currency);
    const node2 = getNodeApi(externalNodeConfig(), currency);

    expect(node1).toBe(node2);
  });

  it("should return cached NodeApi on subsequent calls (createNodeApi called once)", () => {
    const currency = { id: "cached_value_test" } as any;
    const cachedInstance = getNodeApi(externalNodeConfig(), currency);
    const second = getNodeApi(externalNodeConfig(), currency);
    const third = getNodeApi(externalNodeConfig(), currency);

    expect(second).toBe(cachedInstance);
    expect(third).toBe(cachedInstance);
  });

  function generateConfig(node: { type: string; uri: string; retries: number }): EvmConfigInfo {
    return { node } as unknown as EvmConfigInfo;
  }
  it("should return different NodeApi instances for different retries", () => {
    const currency = { id: "ethereum" } as any;
    const nodeConf1 = { type: "external", uri: "u", retries: 2 };
    const node1 = getNodeApi(generateConfig(nodeConf1), currency);

    const nodeConf2 = { ...nodeConf1, retries: 5 };
    const node2 = getNodeApi(generateConfig(nodeConf2), currency);
    expect(node1).not.toBe(node2);
  });

  it("should return different NodeApi instances for different uris", () => {
    const currency = { id: "ethereum" } as any;
    const nodeConf1 = { type: "external", uri: "u1", retries: 2 };
    const node1 = getNodeApi(generateConfig(nodeConf1), currency);

    const nodeConf2 = { ...nodeConf1, uri: "u2" };
    const node2 = getNodeApi(generateConfig(nodeConf2), currency);

    expect(node1).not.toBe(node2);
  });

  it("should return different NodeApi instances for different currencies", () => {
    const conf = generateConfig({ type: "external", uri: "u1", retries: 2 });

    const currency1 = { id: "ethereum1" } as any;
    const node1 = getNodeApi(conf, currency1);

    const currency2 = { id: "ethereum2" } as any;
    const node2 = getNodeApi(conf, currency2);

    expect(node1).not.toBe(node2);
  });
});
