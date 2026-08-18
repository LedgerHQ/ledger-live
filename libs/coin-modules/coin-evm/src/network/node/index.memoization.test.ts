import { EvmConfigInfo } from "../../config";
import { getNodeApi } from "./index";

const externalNodeConfig = (): EvmConfigInfo =>
  ({ node: { type: "external", uri: "working" } }) as unknown as EvmConfigInfo;

describe("getNodeApi memoization", () => {
  it("should return the same NodeApi instance for same currency and retries (memoization)", () => {
    const node1 = getNodeApi(externalNodeConfig(), "ethereum");
    const node2 = getNodeApi(externalNodeConfig(), "ethereum");

    expect(node1).toBe(node2);
  });

  it("should return cached NodeApi on subsequent calls (createNodeApi called once)", () => {
    const cachedInstance = getNodeApi(externalNodeConfig(), "cached_value_test");
    const second = getNodeApi(externalNodeConfig(), "cached_value_test");
    const third = getNodeApi(externalNodeConfig(), "cached_value_test");

    expect(second).toBe(cachedInstance);
    expect(third).toBe(cachedInstance);
  });

  function generateConfig(node: { type: string; uri: string; retries: number }): EvmConfigInfo {
    return { node } as unknown as EvmConfigInfo;
  }
  it("should return different NodeApi instances for different retries", () => {
    const nodeConf1 = { type: "external", uri: "u", retries: 2 };
    const node1 = getNodeApi(generateConfig(nodeConf1), "ethereum");

    const nodeConf2 = { ...nodeConf1, retries: 5 };
    const node2 = getNodeApi(generateConfig(nodeConf2), "ethereum");
    expect(node1).not.toBe(node2);
  });

  it("should return different NodeApi instances for different uris", () => {
    const nodeConf1 = { type: "external", uri: "u1", retries: 2 };
    const node1 = getNodeApi(generateConfig(nodeConf1), "ethereum");

    const nodeConf2 = { ...nodeConf1, uri: "u2" };
    const node2 = getNodeApi(generateConfig(nodeConf2), "ethereum");

    expect(node1).not.toBe(node2);
  });

  it("should return different NodeApi instances for different currencies", () => {
    const conf = generateConfig({ type: "external", uri: "u1", retries: 2 });

    const node1 = getNodeApi(conf, "ethereum1");
    const node2 = getNodeApi(conf, "ethereum2");

    expect(node1).not.toBe(node2);
  });
});
