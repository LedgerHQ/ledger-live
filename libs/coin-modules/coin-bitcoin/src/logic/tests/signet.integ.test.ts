import { bitcoinDefaults, type BitcoinContext } from "../../config";
import { getBlockInfo } from "../getBlockInfo";
import { lastBlock } from "../lastBlock";

const liveContext: BitcoinContext = {
  config: async currencyId => bitcoinDefaults[currencyId as keyof typeof bitcoinDefaults],
  logger: () => {},
};

const SIGNET_BLOCK_1_HASH = "00000086d6b2636cb2a392d45edc4ec544a10024d30141c9adf4bfd9de533b53";
const TESTNET3_BLOCK_1_HASH = "00000000b873e79784647a6c82962c70d228557d24a747ea4d1b8bbe878e1206";

describe("bitcoin_signet explorer route (live explorer)", () => {
  it("serves the Signet chain, not testnet3", async () => {
    const [signet, testnet] = await Promise.all([
      getBlockInfo(liveContext, "bitcoin_signet", 1),
      getBlockInfo(liveContext, "bitcoin_testnet", 1),
    ]);

    expect(signet.hash).toBe(SIGNET_BLOCK_1_HASH);
    expect(testnet.hash).toBe(TESTNET3_BLOCK_1_HASH);
  });

  it("returns a Signet tip distinct from the testnet3 tip", async () => {
    const [signet, testnet] = await Promise.all([
      lastBlock(liveContext, "bitcoin_signet"),
      lastBlock(liveContext, "bitcoin_testnet"),
    ]);

    expect(signet.height).toBeGreaterThan(0);
    expect(signet.hash).not.toBe(testnet.hash);
    expect(signet.height).not.toBe(testnet.height);
  });
});
