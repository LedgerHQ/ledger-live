// @flow

import {
  getAccountName,
  getBrokerage,
  getTronSuperRepresentativeData
} from "../../api/Tron";
import sumBy from "lodash/sumBy";

export default () => {
  describe("tron super representative data", () => {
    test("max is undefined", async () => {
      const srData = await getTronSuperRepresentativeData();
      expect(srData.list.length).toBeGreaterThan(27);
      expect(srData.totalVotes).toEqual(sumBy(srData.list, "voteCount"));
      expect(srData.nextVotingDate.getTime()).toBeGreaterThanOrEqual(
        new Date().getTime()
      );
    });

    test("max is set to 27", async () => {
      const srData = await getTronSuperRepresentativeData(27);
      expect(srData.list.length).toEqual(27);
      expect(srData.totalVotes).toBeGreaterThan(
        sumBy(srData.list, "voteCount")
      );
      expect(srData.nextVotingDate.getTime()).toBeGreaterThanOrEqual(
        new Date().getTime()
      );
    });
  });

  describe("get account name", () => {
    test("from a top SR (binance)", async () => {
      const name = await getAccountName("TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH");
      expect(name).toEqual("Binance Staking");
    });

    test("from an account (name is unset)", async () => {
      const name = await getAccountName("TMn5m53QQBhg2VU1acpZpAbcccxUH2eZzr");
      expect(name).toBeUndefined();
    });
  });

  describe("get brokerage", () => {
    test("from a top SR (binance)", async () => {
      const brokerage = await getBrokerage(
        "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH"
      );
      expect(brokerage).toEqual(20);
    });
  });
};
