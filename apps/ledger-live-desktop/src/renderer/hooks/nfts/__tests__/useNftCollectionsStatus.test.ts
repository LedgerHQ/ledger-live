import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useNftCollectionsStatus } from "../useNftCollectionsStatus";
import { mockNftCollectionStatusByNetwork } from "./shared";

describe("useNftCollectionsStatus", () => {
  it("should returns only NFTs (contract) with  NftStatus !== whitelisted when FF is ON", () => {
    const { result } = renderHook(() => useNftCollectionsStatus(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: true,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
        },
      },
    });

    expect(result.current.hiddenNftCollections).toEqual([
      "collectionETHB",
      "collectionETHC",
      "collectionETHD",
      "collectionAVAX1",
      "collectionAVAX2",
      "collectionAVAX3",
      "collectionP1",
    ]);
  });

  it("should returns only NFTs (contract) with  NftStatus.blacklisted when FF is oFF ", () => {
    const { result } = renderHook(() => useNftCollectionsStatus(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: false,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
        },
      },
    });

    expect(result.current.hiddenNftCollections).toEqual([
      "collectionETHB",
      "collectionAVAX1",
      "collectionAVAX3",
      "collectionP1",
    ]);
  });

  it("should not return spams in the list for a transaction view only when lldSpamFilteringTx is disabled", () => {
    const { result } = renderHook(() => useNftCollectionsStatus(true), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: true,
            },
            lldSpamFilteringTx: {
              enabled: false,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
        },
      },
    });

    expect(result.current.hiddenNftCollections).toEqual([
      "collectionETHB",
      "collectionAVAX1",
      "collectionAVAX3",
      "collectionP1",
    ]);
  });
  it("should all spams in the list for a transaction view only when lldSpamFilteringTx is enabled", () => {
    const { result } = renderHook(() => useNftCollectionsStatus(true), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: true,
            },
            lldSpamFilteringTx: {
              enabled: true,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
        },
      },
    });

    expect(result.current.hiddenNftCollections).toEqual([
      "collectionETHB",
      "collectionETHC",
      "collectionETHD",
      "collectionAVAX1",
      "collectionAVAX2",
      "collectionAVAX3",
      "collectionP1",
    ]);
  });
});
