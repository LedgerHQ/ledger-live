import BigNumber from "bignumber.js";
import { getAccount, getStakingInfo, getStakingProgress, getValidators } from "./sidecar";
import coinConfig from "../config";

describe("sidecar integration test", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://polkadot-rpc.publicnode.com",
      },
      sidecar: {
        url: "https://polkadot-sidecar.coin.ledger.com",
      },
      staking: {
        electionStatusThreshold: 25,
      },
      metadataShortener: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    }));
  });

  describe("getStakingProgress", () => {
    it("returns expected result", async () => {
      const result = await getStakingProgress();

      expect(result).toEqual({
        activeEra: expect.any(Number),
        bondingDuration: 28,
        electionClosed: true,
        maxNominatorRewardedPerValidator: 128,
      });
    });
  });

  describe("getStakingInfo", () => {
    it("returns expected result", async () => {
      const address = "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL";
      const result = await getStakingInfo(address);

      expect(result).toEqual({
        controller: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
        numSlashingSpans: 0,
        stash: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
        unlockedBalance: BigNumber("0"),
        unlockingBalance: BigNumber("0"),
        unlockings: [],
      });
    });
  });

  describe("getAccount", () => {
    it("returns expected result", async () => {
      const address = "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL";
      const result = await getAccount(address);

      expect(result).toMatchObject({
        balance: expect.any(BigNumber),
        // blockHeight: expect.any(Number),
        controller: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
        lockedBalance: expect.any(BigNumber),
        nominations: [],
        nonce: expect.any(Number),
        numSlashingSpans: 0,
        spendableBalance: expect.any(BigNumber),
        stash: "163WJAxWrQzsAVEZdn2w6mq4gmT4FmEgvCfex3uEEUHTE9GL",
        unlockedBalance: BigNumber("0"),
        unlockingBalance: BigNumber("0"),
        unlockings: [],
      });
    }, 10000);
  });

  describe("getValidators", () => {
    it.skip("returns expected result", async () => {
      const result = await getValidators();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            address: "111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S",
            commission: BigNumber("1"),
            identity: "",
            isElected: true,
            isOversubscribed: false,
            nominatorsCount: expect.any(Number),
            selfBonded: BigNumber("0"),
            totalBonded: expect.any(BigNumber),
          }),
        ]),
      );
    }, 10000); // 10 seconds, because more than 5s may be required
  });
});
