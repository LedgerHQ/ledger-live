import BigNumber from "bignumber.js";
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
  getBlock,
  fetchChainSpec,
} from "./sidecar";
import { polkadotDefaults } from "../config";

const logger = jest.fn();

const CURRENCY_CONFIGS = {
  polkadot: {
    config: polkadotDefaults.polkadot,
    testAddress: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
  },
  assethub_polkadot: {
    config: polkadotDefaults.assethub_polkadot,
    // Asset Hub Polkadot uses SS58 prefix 0, so a polkadot-format address is required.
    testAddress: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
  },
  westend: {
    config: polkadotDefaults.westend,
    testAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
  assethub_westend: {
    config: polkadotDefaults.assethub_westend,
    testAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
};

describe("sidecar integration test", () => {
  describe.each(Object.entries(CURRENCY_CONFIGS))(
    "%s tests",
    (currencyId, { config, testAddress }) => {
      describe("getValidators", () => {
        // Westend and Polkadot relay-chain staking has migrated to Asset Hub and is no longer
        // supported: the relay node no longer registers validators in the staking pallet, so
        // `getValidators` returns an empty array here. The `assethub_*` chains are the
        // supported ones and keep this assertion.
        const test = ["westend", "polkadot"].includes(currencyId) ? it.skip : it;
        test(`returns expected result with ${currencyId}`, async () => {
          const result = await getValidators(config, undefined);

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
          const result = await getAccount(logger, config, testAddress, currencyId);

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
          const result = await getStakingInfo(logger, config, testAddress, currencyId);

          expect(result).toMatchObject({
            unlockedBalance: expect.any(BigNumber),
            unlockingBalance: expect.any(BigNumber),
            unlockings: expect.any(Array),
          });
        });
      });

      describe("getStakingProgress", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getStakingProgress(logger, config, currencyId);

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
          const result = await getBalances(config, testAddress, currencyId);

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
          const result = await getMinimumBondBalance(config, currencyId);

          expect(result).toBeInstanceOf(BigNumber);
          expect(result.isGreaterThanOrEqualTo(0)).toBe(true);
        });
      });

      describe("isElectionClosed", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await isElectionClosed(config, currencyId);

          expect(typeof result).toBe("boolean");
        });
      });

      describe("isNewAccount", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await isNewAccount(config, testAddress, currencyId);

          expect(typeof result).toBe("boolean");
        });
      });

      describe("isControllerAddress", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await isControllerAddress(config, testAddress, currencyId);

          expect(typeof result).toBe("boolean");
        });
      });

      describe("getTransactionParams", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getTransactionParams(config, currencyId);

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
          const result = await getRegistry(config, currencyId);

          expect(result).toMatchObject({
            registry: expect.any(Object),
            extrinsics: expect.any(Object),
          });
        });
      });

      describe("getLastBlock", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await getLastBlock(config, currencyId);

          expect(result).toMatchObject({
            hash: expect.any(String),
            height: expect.any(Number),
            time: expect.any(Date),
          });
        });
      });

      describe("getBlock", () => {
        it(`returns the same block by height and by hash with ${currencyId}`, async () => {
          const { height } = await getLastBlock(config, currencyId);

          const byHeight = await getBlock(config, height, currencyId);
          const byHash = await getBlock(config, byHeight.hash, currencyId);

          expect(byHeight.number).toEqual(String(height));
          expect(byHash).toMatchObject({ number: byHeight.number, hash: byHeight.hash });
          expect(byHeight.extrinsics.length).toBeGreaterThan(0);
        });

        it(`rejects a block that does not exist yet with ${currencyId}`, async () => {
          await expect(getBlock(config, Number.MAX_SAFE_INTEGER, currencyId)).rejects.toThrow(
            /not found/,
          );
        });
      });

      describe("fetchChainSpec", () => {
        it(`works with ${currencyId}`, async () => {
          const result = await fetchChainSpec(config, currencyId);

          expect(result).toMatchObject({
            properties: expect.any(Object),
          });
        });
      });
    },
  );
});
