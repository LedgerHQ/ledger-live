import { useNftCollectionsStatus } from "../useNftCollectionsStatus";
import { renderHook } from "@tests/test-renderer";
import { INITIAL_STATE } from "~/reducers/settings";
import { State } from "~/reducers/types";
import { mockNftCollectionStatusByNetwork2 } from "./shared";

describe("useNftCollectionsStatus", () => {
  it("should returns only NFTs (contract) with  NftStatus !== whitelisted when FF is ON", () => {
    const { result } = renderHook(() => useNftCollectionsStatus(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: true,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork2,
        },
      }),
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
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: false,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork2,
        },
      }),
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
      overrideInitialState: (state: State) => ({
        ...state,
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
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork2,
        },
      }),
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
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            nftsFromSimplehash: {
              enabled: true,
            },
            llmSpamFilteringTx: {
              enabled: true,
            },
          },
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork2,
        },
      }),
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
