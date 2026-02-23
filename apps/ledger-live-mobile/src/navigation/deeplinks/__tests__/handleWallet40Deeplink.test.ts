import { NavigatorName, ScreenName } from "~/const";
import { handleWallet40Deeplink } from "../handleWallet40Deeplink";

describe("handleWallet40Deeplink", () => {
  describe('hostname === "discover"', () => {
    it("should return Discover navigation state when platform is empty", () => {
      const result = handleWallet40Deeplink("discover", "", {});

      expect(result).toEqual({
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.Discover,
                  state: {
                    routes: [{ name: ScreenName.DiscoverScreen }],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("should have Main at index 0 so back press returns to Main instead of exiting the app", () => {
      const result = handleWallet40Deeplink("discover", "", {});

      const baseState = result?.routes[0].state;
      expect(baseState?.index).toBe(1);
      expect(baseState?.routes[0]).toEqual({ name: NavigatorName.Main });
    });

    it("should return undefined when platform is provided", () => {
      const result = handleWallet40Deeplink("discover", "some-platform", {});
      expect(result).toBeUndefined();
    });
  });

  describe('hostname === "myledger"', () => {
    it("should return MyLedger navigation state with query params", () => {
      const result = handleWallet40Deeplink("myledger", "", {
        searchQuery: "ledger nano",
        installApp: "bitcoin",
      });

      expect(result).toEqual({
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.MyLedger,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyLedgerChooseDevice,
                        params: {
                          searchQuery: "ledger nano",
                          installApp: "bitcoin",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("should have Main at index 0 so back press returns to Main instead of exiting the app", () => {
      const result = handleWallet40Deeplink("myledger", "", {});

      const baseState = result?.routes[0].state;
      expect(baseState?.index).toBe(1);
      expect(baseState?.routes[0]).toEqual({ name: NavigatorName.Main });
    });

    it("should return MyLedger navigation state with undefined params when query is empty", () => {
      const result = handleWallet40Deeplink("myledger", "", {});

      expect(result).toEqual({
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.MyLedger,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyLedgerChooseDevice,
                        params: {
                          searchQuery: undefined,
                          installApp: undefined,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe("unhandled hostnames", () => {
    it("should return undefined for an unknown hostname", () => {
      const result = handleWallet40Deeplink("wallet", "", {});
      expect(result).toBeUndefined();
    });

    it("should return undefined for an empty hostname", () => {
      const result = handleWallet40Deeplink("", "", {});
      expect(result).toBeUndefined();
    });
  });
});
