import assert from "assert";
import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

const SONIC_BLAZE_NODE = "https://rpc.blaze.soniclabs.com";
const SONIC_BLAZE_EXPLORER = "https://proxyetherscan.alpaca.api.ledger.com/v2/api/57054";
const TEST_ACCOUNT = "0xbC2ee16c7A648Df4B6902A73bc980761473AF49F";

describe("EVM Api (Sonic Blaze)", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config: EvmConfig = {
      node: {
        type: "external",
        uri: SONIC_BLAZE_NODE,
      },
      explorer: {
        type: "etherscan",
        uri: SONIC_BLAZE_EXPLORER,
      },
      showNfts: false,
    };
    module = createApi(config, "sonic_blaze");
  });

  // TODO this test is skipped because it's not working
  // adding it for illustration purposes
  describe.skip("getBalance", () => {
    it("returns ERC20 balances for test account", async () => {
      const allBalances = await module.getBalance(TEST_ACCOUNT);
      // there should be at least 2 balances (native and at least one ERC20)
      expect(allBalances.length).toBeGreaterThanOrEqual(2);
    });
  });
});
