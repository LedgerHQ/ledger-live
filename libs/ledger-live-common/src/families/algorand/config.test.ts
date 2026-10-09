import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../../config";
import { algorandConfig } from "./config";

describe("algorandConfig", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(algorandConfig);
    LiveConfig.instance.provider = undefined;
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });

  it("ships the node and indexer endpoints in the default", () => {
    const { node, indexer } = getCurrencyConfiguration("algorand");

    expect(node).toMatch(/^https:\/\/.+\/ps2\/v2$/);
    expect(indexer).toMatch(/^https:\/\/.+\/idx2\/v2$/);
  });
});
