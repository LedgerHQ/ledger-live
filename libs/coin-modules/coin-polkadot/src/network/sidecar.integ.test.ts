import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import {
  getAccount,
  getStakingInfo,
  getStakingProgress,
  getValidators,
  getBalances,
  getMinimumBondBalance,
  isElectionClosed,
  isNewAccount,
  isControllerAddress,
  getTransactionParams,
  getRegistry,
  getLastBlock,
  fetchChainSpec,
} from "./sidecar";

const CURRENCY_CONFIGS = {
  polkadot: {
    currency: getCryptoCurrencyById("polkadot"),
    config: {
      status: { type: "active" as const },
      node: { url: "https://polkadot-rpc.publicnode.com" },
      sidecar: { url: "https://polkadot-sidecar.coin.ledger.com" },
      indexer: { url: "https://polkadot.coin.ledger.com" },
      staking: { electionStatusThreshold: 25 },
      metadataShortener: {
        id: "dot",
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    },
    testAddress: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
  },
  assethub_polkadot: {
    currency: getCryptoCurrencyById("assethub_polkadot"),
    config: {
      status: { type: "active" as const },
      sidecar: { url: "https://polkadot-asset-hub-sidecar.coin.ledger.com" },
      node: { url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com" },
      indexer: { url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub" },
      staking: { electionStatusThreshold: 25 },
      metadataShortener: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
        id: "dot-hub",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        id: "dot-hub",
      },
      hasBeenMigrated: true,
    },
    testAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
  westend: {
    currency: getCryptoCurrencyById("westend"),
    config: {
      status: { type: "active" as const },
      sidecar: { url: "https://polkadot-westend-sidecar.coin.ledger.com/rc" },
      node: { url: "https://polkadot-westend-fullnodes.api.live.ledger.com" },
      indexer: { url: "https://explorers.api.live.ledger.com/blockchain/dot_westend" },
      metadataShortener: {
        url: "https://polkadot-westend-metadata-shortener.api.live.ledger.com/transaction/metadata",
        id: "dot-hub",
      },
      metadataHash: {
        url: "https://polkadot-westend-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        id: "dot-hub",
      },
    },
    testAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
  assethub_westend: {
    currency: getCryptoCurrencyById("assethub_westend"),
    config: {
      status: { type: "active" as const },
      sidecar: { url: "https://polkadot-westend-sidecar.coin.ledger.com" },
      node: { url: "https://polkadot-westend-asset-hub-fullnodes.api.live.ledger.com" },
      indexer: { url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub_westend" },
      metadataShortener: {
        url: "https://polkadot-westend-metadata-shortener.api.live.ledger.com/transaction/metadata",
        id: "dot-hub",
      },
      metadataHash: {
        url: "https://polkadot-westend-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        id: "dot-hub",
      },
    },
    testAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
};

describe("sidecar integration test", () => {
  describe.each(Object.entries(CURRENCY_CONFIGS))(
    "%s tests",
    (currencyId, { currency, config, testAddress }) => {
      beforeAll(() => {
        coinConfig.setCoinConfig(() => config);
      });

      describe("getValidators", () => {
        it(`returns expected result with ${currencyId}`, async () => {
          const result = await getValidators(undefined, currency);

          expect(result).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                address: expect.any(String),
                commission: expect.any(BigNumber),
                identity: expect.any(String),
                isElected: expect.any(Boolean),
                isOversubscribed: expect.any(Boolean),
                nominatorsCount: expect.any(Number),
                selfBonded: expect.any(BigNumber),
                totalBonded: expect.any(BigNumber),
              }),
            ]),
          );
        }, 10000); // 10 seconds, because more than 5s may be required
      });

      describe("getAccount", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getAccount(testAddress, currency);

          expect(result).toMatchObject({
            balance: expect.any(BigNumber),
            blockHeight: expect.any(Number),
            lockedBalance: expect.any(BigNumber),
            nominations: expect.any(Array),
            nonce: expect.any(Number),
            spendableBalance: expect.any(BigNumber),
            unlockedBalance: expect.any(BigNumber),
            unlockingBalance: expect.any(BigNumber),
            unlockings: expect.any(Array),
          });
        });
      });

      describe("getStakingInfo", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getStakingInfo(testAddress, currency);

          expect(result).toMatchObject({
            unlockedBalance: expect.any(BigNumber),
            unlockingBalance: expect.any(BigNumber),
            unlockings: expect.any(Array),
          });
        });
      });

      describe("getStakingProgress", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getStakingProgress(currency);

          expect(result).toMatchObject({
            activeEra: expect.any(Number),
            bondingDuration: expect.any(Number),
            electionClosed: expect.any(Boolean),
            maxNominatorRewardedPerValidator: expect.any(Number),
          });
        });
      });

      describe("getBalances", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getBalances(testAddress, currency);

          expect(result).toMatchObject({
            balance: expect.any(BigNumber),
            blockHeight: expect.any(Number),
            lockedBalance: expect.any(BigNumber),
            nonce: expect.any(Number),
            spendableBalance: expect.any(BigNumber),
          });
        });
      });

      describe("getMinimumBondBalance", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getMinimumBondBalance(currency);

          expect(result).toBeInstanceOf(BigNumber);
          expect(result.isGreaterThanOrEqualTo(0)).toBe(true);
        });
      });

      describe("isElectionClosed", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await isElectionClosed(currency);

          expect(typeof result).toBe("boolean");
        });
      });

      describe("isNewAccount", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await isNewAccount(testAddress, currency);

          expect(typeof result).toBe("boolean");
        });
      });

      describe("isControllerAddress", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await isControllerAddress(testAddress, currency);

          expect(typeof result).toBe("boolean");
        });
      });

      describe("getTransactionParams", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getTransactionParams(currency);

          expect(result).toMatchObject({
            blockHash: expect.any(String),
            blockNumber: expect.any(String),
            chainName: expect.any(String),
            genesisHash: expect.any(String),
            specName: expect.any(String),
            transactionVersion: expect.any(String),
            specVersion: expect.any(String),
          });
        });
      });

      describe("getRegistry", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getRegistry(currency);

          expect(result).toMatchObject({
            registry: expect.any(Object),
            extrinsics: expect.any(Object),
          });
        });
      });

      describe("getLastBlock", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getLastBlock(currency);

          expect(result).toMatchObject({
            hash: expect.any(String),
            height: expect.any(Number),
            time: expect.any(Date),
          });
        });
      });

      describe("fetchChainSpec", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await fetchChainSpec(currency);

          expect(result).toMatchObject({
            properties: expect.any(Object),
          });
        });
      });
    },
  );
});
