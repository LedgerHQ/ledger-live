import { BlockchainEVM } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";
import { useNftCollectionsStatus } from "../useNftCollectionsStatus";
import { renderHook } from "@tests/test-renderer";
import { INITIAL_STATE } from "~/reducers/settings";
import { State } from "~/reducers/types";

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
            [BlockchainEVM.Arbitrum]: {},
            [BlockchainEVM.Base]: {},
            [BlockchainEVM.Blast]: {},
            [BlockchainEVM.Bsc]: {},
            [BlockchainEVM.Canto]: {},
            [BlockchainEVM.Celo]: {},
            [BlockchainEVM.Cyber]: {},
            [BlockchainEVM.Degen]: {},
            [BlockchainEVM.Fantom]: {},
            [BlockchainEVM.Gnosis]: {},
            [BlockchainEVM.Godwoken]: {},
            [BlockchainEVM.Linea]: {},
            [BlockchainEVM.Loot]: {},
            [BlockchainEVM.Manta]: {},
            [BlockchainEVM.Mode]: {},
            [BlockchainEVM.Moonbeam]: {},
            [BlockchainEVM.Opbnb]: {},
            [BlockchainEVM.Optimism]: {},
            [BlockchainEVM.Palm]: {},
            [BlockchainEVM.ProofOfPlay]: {},
            [BlockchainEVM.Rari]: {},
            [BlockchainEVM.Scroll]: {},
            [BlockchainEVM.Sei]: {},
            [BlockchainEVM.Xai]: {},
            [BlockchainEVM.Zora]: {},
          },
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
            [BlockchainEVM.Arbitrum]: {},
            [BlockchainEVM.Base]: {},
            [BlockchainEVM.Blast]: {},
            [BlockchainEVM.Bsc]: {},
            [BlockchainEVM.Canto]: {},
            [BlockchainEVM.Celo]: {},
            [BlockchainEVM.Cyber]: {},
            [BlockchainEVM.Degen]: {},
            [BlockchainEVM.Fantom]: {},
            [BlockchainEVM.Gnosis]: {},
            [BlockchainEVM.Godwoken]: {},
            [BlockchainEVM.Linea]: {},
            [BlockchainEVM.Loot]: {},
            [BlockchainEVM.Manta]: {},
            [BlockchainEVM.Mode]: {},
            [BlockchainEVM.Moonbeam]: {},
            [BlockchainEVM.Opbnb]: {},
            [BlockchainEVM.Optimism]: {},
            [BlockchainEVM.Palm]: {},
            [BlockchainEVM.ProofOfPlay]: {},
            [BlockchainEVM.Rari]: {},
            [BlockchainEVM.Scroll]: {},
            [BlockchainEVM.Sei]: {},
            [BlockchainEVM.Xai]: {},
            [BlockchainEVM.Zora]: {},
          },
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
            [BlockchainEVM.Arbitrum]: {},
            [BlockchainEVM.Base]: {},
            [BlockchainEVM.Blast]: {},
            [BlockchainEVM.Bsc]: {},
            [BlockchainEVM.Canto]: {},
            [BlockchainEVM.Celo]: {},
            [BlockchainEVM.Cyber]: {},
            [BlockchainEVM.Degen]: {},
            [BlockchainEVM.Fantom]: {},
            [BlockchainEVM.Gnosis]: {},
            [BlockchainEVM.Godwoken]: {},
            [BlockchainEVM.Linea]: {},
            [BlockchainEVM.Loot]: {},
            [BlockchainEVM.Manta]: {},
            [BlockchainEVM.Mode]: {},
            [BlockchainEVM.Moonbeam]: {},
            [BlockchainEVM.Opbnb]: {},
            [BlockchainEVM.Optimism]: {},
            [BlockchainEVM.Palm]: {},
            [BlockchainEVM.ProofOfPlay]: {},
            [BlockchainEVM.Rari]: {},
            [BlockchainEVM.Scroll]: {},
            [BlockchainEVM.Sei]: {},
            [BlockchainEVM.Xai]: {},
            [BlockchainEVM.Zora]: {},
          },
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
            [BlockchainEVM.Arbitrum]: {},
            [BlockchainEVM.Base]: {},
            [BlockchainEVM.Blast]: {},
            [BlockchainEVM.Bsc]: {},
            [BlockchainEVM.Canto]: {},
            [BlockchainEVM.Celo]: {},
            [BlockchainEVM.Cyber]: {},
            [BlockchainEVM.Degen]: {},
            [BlockchainEVM.Fantom]: {},
            [BlockchainEVM.Gnosis]: {},
            [BlockchainEVM.Godwoken]: {},
            [BlockchainEVM.Linea]: {},
            [BlockchainEVM.Loot]: {},
            [BlockchainEVM.Manta]: {},
            [BlockchainEVM.Mode]: {},
            [BlockchainEVM.Moonbeam]: {},
            [BlockchainEVM.Opbnb]: {},
            [BlockchainEVM.Optimism]: {},
            [BlockchainEVM.Palm]: {},
            [BlockchainEVM.ProofOfPlay]: {},
            [BlockchainEVM.Rari]: {},
            [BlockchainEVM.Scroll]: {},
            [BlockchainEVM.Sei]: {},
            [BlockchainEVM.Xai]: {},
            [BlockchainEVM.Zora]: {},
          },
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
