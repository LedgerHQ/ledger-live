import { renderHook } from "tests/testUtils";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { BlockchainEVM } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";
import { useNftCollectionsStatus } from "../useNftCollectionsStatus";

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
          nftCollectionsStatusByNetwork: {
            [BlockchainEVM.Ethereum]: {
              collectionETHA: NftStatus.whitelisted,
              collectionETHB: NftStatus.blacklisted,
              collectionETHC: NftStatus.spam,
              collectionETHD: NftStatus.spam,
            },
            [BlockchainEVM.Avalanche]: {
              collectionAVAX1: NftStatus.blacklisted,
              collectionAVAX2: NftStatus.spam,
              collectionAVAX3: NftStatus.blacklisted,
            },
            [BlockchainEVM.Polygon]: {
              collectionP1: NftStatus.blacklisted,
              collectionP2: NftStatus.whitelisted,
            },
          },
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
          nftCollectionsStatusByNetwork: {
            [BlockchainEVM.Ethereum]: {
              collectionETHA: NftStatus.whitelisted,
              collectionETHB: NftStatus.blacklisted,
              collectionETHC: NftStatus.spam,
              collectionETHD: NftStatus.spam,
            },
            [BlockchainEVM.Avalanche]: {
              collectionAVAX1: NftStatus.blacklisted,
              collectionAVAX2: NftStatus.spam,
              collectionAVAX3: NftStatus.blacklisted,
            },
            [BlockchainEVM.Polygon]: {
              collectionP1: NftStatus.blacklisted,
              collectionP2: NftStatus.whitelisted,
            },
          },
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
          nftCollectionsStatusByNetwork: {
            [BlockchainEVM.Ethereum]: {
              collectionETHA: NftStatus.whitelisted,
              collectionETHB: NftStatus.blacklisted,
              collectionETHC: NftStatus.spam,
              collectionETHD: NftStatus.spam,
            },
            [BlockchainEVM.Avalanche]: {
              collectionAVAX1: NftStatus.blacklisted,
              collectionAVAX2: NftStatus.spam,
              collectionAVAX3: NftStatus.blacklisted,
            },
            [BlockchainEVM.Polygon]: {
              collectionP1: NftStatus.blacklisted,
              collectionP2: NftStatus.whitelisted,
            },
          },
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
          nftCollectionsStatusByNetwork: {
            [BlockchainEVM.Ethereum]: {
              collectionETHA: NftStatus.whitelisted,
              collectionETHB: NftStatus.blacklisted,
              collectionETHC: NftStatus.spam,
              collectionETHD: NftStatus.spam,
            },
            [BlockchainEVM.Avalanche]: {
              collectionAVAX1: NftStatus.blacklisted,
              collectionAVAX2: NftStatus.spam,
              collectionAVAX3: NftStatus.blacklisted,
            },
            [BlockchainEVM.Polygon]: {
              collectionP1: NftStatus.blacklisted,
              collectionP2: NftStatus.whitelisted,
            },
          },
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
