import { useAppVersionBlockCheck } from "./useAppVersionBlockCheck";

describe("useAppVersionBlockCheck", () => {
  describe("LLM", () => {
    it("should update if current version is not compatible on android", () => {
      // given
      const getConfigValue = () => ({
        llm: {
          android: [
            {
              minOsVersion: "32",
              version: "2.0.3",
            },
          ],
        },
      });
      // when
      const { shouldUpdate } = useAppVersionBlockCheck({
        appVersion: "2.0.1",
        osVersion: "32",
        platform: "android",
        appKey: "llm",
        getConfigValue,
      });
      //then
      expect(shouldUpdate).toBe(true);
    });
    it("should update if current version is not compatible on ios", () => {
      const getConfigValue = () => ({
        llm: {
          ios: [
            {
              minOsVersion: "32",
              version: "2.0.3",
            },
          ],
        },
      });
      // when
      const { shouldUpdate } = useAppVersionBlockCheck({
        appVersion: "2.0.1",
        osVersion: "32",
        platform: "ios",
        appKey: "llm",
        getConfigValue,
      });
      //then
      expect(shouldUpdate).toBe(true);
    });
    it("should not update the app if current version is not compatible on android with another os version", () => {
      // given
      const getConfigValue = () => ({
        llm: {
          android: [
            {
              minOsVersion: "33",
              version: "2.0.3",
            },
          ],
        },
      });
      // when
      const { shouldUpdate } = useAppVersionBlockCheck({
        appVersion: "2.0.1",
        osVersion: "32",
        platform: "android",
        appKey: "llm",
        getConfigValue,
      });
      //then
      expect(shouldUpdate).toBe(false);
    });
    it("should not update the app if current version is not compatible on ios with another os version", () => {
      // given
      const getConfigValue = () => ({
        llm: {
          ios: [
            {
              minOsVersion: "33",
              version: "2.0.3",
            },
          ],
        },
      });
      // when
      const { shouldUpdate } = useAppVersionBlockCheck({
        appVersion: "2.0.1",
        osVersion: "32",
        platform: "ios",
        appKey: "llm",
        getConfigValue,
      });
      //then
      expect(shouldUpdate).toBe(false);
    });
    it.each([
      ["android", "2.1.3"],
      ["ios", "2.1.3"],
      ["android", "2.1.3-rc.2"],
      ["ios", "2.1.3-rc.2"],
      ["android", "2.2.3-next.0"],
      ["ios", "2.2.3-next.0"],
      ["android", "2.0.3-rc2"],
      ["ios", "2.0.3-rc2"],
      ["android", "2.0.3-next.3"],
      ["ios", "2.0.3-next.3"],
    ])(
      "should not update the app on %s for version %s compatible with 2.0.3",
      (platform, appVersion) => {
        // given
        const getConfigValue = () => ({
          llm: {
            [platform]: [
              {
                minOsVersion: "32",
                version: "2.0.3",
              },
            ],
          },
        });
        // when
        const { shouldUpdate } = useAppVersionBlockCheck({
          appVersion,
          osVersion: "32",
          platform: platform as "ios" | "android",
          appKey: "llm",
          getConfigValue,
        });
        // then
        expect(shouldUpdate).toBe(false);
      },
    );
  });
});
