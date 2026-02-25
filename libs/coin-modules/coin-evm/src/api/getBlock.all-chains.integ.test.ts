import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { EvmConfig } from "../config";
import { getNodeApi } from "../network/node";
import { RpcUnsupportedError } from "../network/node/rpc.common";
import { createApi } from "./index";

jest.setTimeout(15 * 60 * 1000);
const runAllChainsMatrix = process.env.RUN_ALL_EVM_GET_BLOCK_INTEG === "1";
const describeAllChains = runAllChainsMatrix ? describe : describe.skip;

const EXTERNAL_EVM_CHAINS: ReadonlyArray<{ currencyId: CryptoCurrencyId; rpcUri: string }> = [
  { currencyId: "arbitrum", rpcUri: "https://arbitrum.coin.ledger.com" },
  { currencyId: "arbitrum_sepolia", rpcUri: "https://sepolia-rollup.arbitrum.io/rpc" },
  { currencyId: "astar", rpcUri: "https://evm.astar.network" },
  { currencyId: "avalanche_c_chain_fuji", rpcUri: "https://api.avax-test.network/ext/bc/C/rpc" },
  { currencyId: "base", rpcUri: "https://base.coin.ledger.com" },
  { currencyId: "base_sepolia", rpcUri: "https://sepolia.base.org" },
  { currencyId: "berachain", rpcUri: "https://rpc.berachain.com" },
  { currencyId: "bitlayer", rpcUri: "https://rpc.bitlayer.org" },
  { currencyId: "bittorrent", rpcUri: "https://rpc.bt.io" },
  { currencyId: "blast", rpcUri: "https://rpc.blast.io" },
  { currencyId: "blast_sepolia", rpcUri: "https://sepolia.blast.io" },
  { currencyId: "boba", rpcUri: "https://mainnet.boba.network" },
  { currencyId: "core", rpcUri: "https://rpc.ankr.com/core" },
  { currencyId: "cronos", rpcUri: "https://evm.cronos.org" },
  { currencyId: "energy_web", rpcUri: "https://rpc.energyweb.org" },
  { currencyId: "etherlink", rpcUri: "https://node.mainnet.etherlink.com" },
  { currencyId: "fantom", rpcUri: "https://rpcapi.fantom.network" },
  { currencyId: "flare", rpcUri: "https://flare-api.flare.network/ext/bc/C/rpc" },
  { currencyId: "hyperevm", rpcUri: "https://rpc.hypurrscan.io" },
  { currencyId: "klaytn", rpcUri: "https://public-en-cypress.klaytn.net" },
  { currencyId: "klaytn_baobab", rpcUri: "https://api.baobab.klaytn.net:8651" },
  { currencyId: "linea", rpcUri: "https://rpc.linea.build" },
  { currencyId: "linea_sepolia", rpcUri: "https://rpc.sepolia.linea.build" },
  { currencyId: "lukso", rpcUri: "https://rpc.mainnet.lukso.network" },
  { currencyId: "metis", rpcUri: "https://andromeda.metis.io/?owner=1088" },
  { currencyId: "monad", rpcUri: "https://rpc.monad.xyz" },
  { currencyId: "monad_testnet", rpcUri: "https://testnet-rpc.monad.xyz" },
  { currencyId: "moonbeam", rpcUri: "https://rpc.api.moonbeam.network" },
  { currencyId: "moonriver", rpcUri: "https://rpc.api.moonriver.moonbeam.network" },
  { currencyId: "neon_evm", rpcUri: "https://neon-mainnet.everstake.one" },
  { currencyId: "optimism", rpcUri: "https://mainnet.optimism.io" },
  { currencyId: "optimism_sepolia", rpcUri: "https://sepolia.optimism.io" },
  { currencyId: "polygon_zk_evm", rpcUri: "https://zkevm-rpc.com" },
  { currencyId: "polygon_zk_evm_testnet", rpcUri: "https://rpc.public.zkevm-test.net" },
  { currencyId: "rsk", rpcUri: "https://public-node.rsk.co" },
  { currencyId: "scroll", rpcUri: "https://rpc.scroll.io" },
  { currencyId: "scroll_sepolia", rpcUri: "https://sepolia-rpc.scroll.io" },
  { currencyId: "sei_evm", rpcUri: "https://sei-evm-rpc.publicnode.com" },
  { currencyId: "shape", rpcUri: "https://mainnet.shape.network" },
  { currencyId: "somnia", rpcUri: "https://somnia-rpc.publicnode.com" },
  { currencyId: "sonic", rpcUri: "https://rpc.soniclabs.com" },
  { currencyId: "sonic_blaze", rpcUri: "https://rpc.blaze.soniclabs.com" },
  { currencyId: "songbird", rpcUri: "https://songbird-api.flare.network/ext/C/rpc" },
  { currencyId: "story", rpcUri: "https://mainnet.storyrpc.io" },
  { currencyId: "syscoin", rpcUri: "https://rpc.syscoin.org" },
  { currencyId: "telos_evm", rpcUri: "https://rpc.telos.net" },
  { currencyId: "unichain", rpcUri: "https://unichain-rpc.publicnode.com" },
  { currencyId: "unichain_sepolia", rpcUri: "https://unichain-sepolia-rpc.publicnode.com" },
  { currencyId: "velas_evm", rpcUri: "https://evmexplorer.velas.com/rpc" },
  { currencyId: "zero_gravity", rpcUri: "https://evmrpc.0g.ai" },
  { currencyId: "zksync", rpcUri: "https://mainnet.era.zksync.io" },
  { currencyId: "zksync_sepolia", rpcUri: "https://sepolia.era.zksync.dev" },
];

async function findRecentBlockWithTransactions(
  module: Api<MemoNotSupported, BufferTxData>,
  currencyId: CryptoCurrencyId,
): Promise<number | null> {
  const currency = getCryptoCurrencyById(currencyId);
  const nodeApi = getNodeApi(currency);
  const latest = await module.lastBlock();

  for (let offset = 0; offset < 10; offset++) {
    const candidateHeight = Math.max(0, latest.height - offset);
    const candidateBlock = await nodeApi.getBlockByHeight(currency, candidateHeight);
    if ((candidateBlock.transactionHashes?.length ?? 0) > 0) {
      return candidateHeight;
    }
  }

  return null;
}

describeAllChains("getBlock receipts compatibility matrix", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  it("calls getBlock on all configured external EVM chains and classifies eth_getBlockReceipts support", async () => {
    const unsupportedReceiptsErrors: Array<{
      currencyId: CryptoCurrencyId;
      error: string;
    }> = [];
    const unexpectedReceiptsErrors: Array<{
      currencyId: CryptoCurrencyId;
      error: string;
    }> = [];
    const getBlockFailures: Array<{ currencyId: CryptoCurrencyId; message: string }> = [];
    const testedChains: CryptoCurrencyId[] = [];

    for (const chain of EXTERNAL_EVM_CHAINS) {
      const config: EvmConfig = {
        node: {
          type: "external",
          uri: chain.rpcUri,
        },
        explorer: {
          type: "none",
        },
        showNfts: false,
      };
      const module = createApi(config, chain.currencyId);

      let blockHeight: number | null = null;
      try {
        blockHeight = await findRecentBlockWithTransactions(module, chain.currencyId);
      } catch (error) {
        getBlockFailures.push({
          currencyId: chain.currencyId,
          message: `cannot determine recent block with txs: ${String(error)}`,
        });
        continue;
      }

      if (blockHeight === null) {
        continue;
      }

      const currency = getCryptoCurrencyById(chain.currencyId);
      const nodeApi = getNodeApi(currency);
      try {
        await nodeApi.getBlockReceipts?.(currency, blockHeight);
      } catch (error) {
        if (error instanceof RpcUnsupportedError && error.method === "eth_getBlockReceipts") {
          unsupportedReceiptsErrors.push({
            currencyId: chain.currencyId,
            error: JSON.stringify(error.rawError),
          });
        } else {
          unexpectedReceiptsErrors.push({
            currencyId: chain.currencyId,
            error: JSON.stringify(error),
          });
          continue;
        }
      }

      try {
        const block = await module.getBlock(blockHeight);
        expect(block.info.height).toBe(blockHeight);
        testedChains.push(chain.currencyId);
      } catch (error) {
        getBlockFailures.push({
          currencyId: chain.currencyId,
          message: String(error),
        });
      }
    }

    if (unsupportedReceiptsErrors.length > 0) {
      console.info(
        "eth_getBlockReceipts unsupported on chains:",
        JSON.stringify(unsupportedReceiptsErrors, null, 2),
      );
    }
    if (unexpectedReceiptsErrors.length > 0) {
      console.info(
        "Unexpected eth_getBlockReceipts errors (not classified as unsupported):",
        JSON.stringify(unexpectedReceiptsErrors, null, 2),
      );
    }
    if (getBlockFailures.length > 0) {
      console.info(
        "getBlock failures after receipts compatibility probe:",
        JSON.stringify(getBlockFailures, null, 2),
      );
    }

    expect(testedChains.length).toBeGreaterThan(0);
    expect(unexpectedReceiptsErrors).toEqual([]);
    expect(getBlockFailures).toEqual([]);
  });
});
