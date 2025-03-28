import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useChains } from "./useChains";
import { renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/reducers/settings";
import { INITIAL_STATE as INITIAL_STATE_NFT } from "~/reducers/nft";

const filtersFixed = {
  arbitrum: false,
  avalanche_c_chain: false,
  base: false,
  bsc: false,
  optimism: false,
};

jest.mock("@ledgerhq/live-common/hooks/useEnv");

describe("useChains", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return active chains and chain filters", () => {
    const mockSupportedNftCurrencies = ["ethereum", "polygon", "solana"];

    (useEnv as jest.Mock).mockReturnValue(mockSupportedNftCurrencies);

    const { result } = renderHook(() => useChains(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE_SETTINGS,
          overriddenFeatureFlags: {
            llmSolanaNfts: {
              enabled: true,
            },
          },
        },
        nft: {
          ...INITIAL_STATE_NFT,
          galleryChainFilters: {
            ...filtersFixed,
            ethereum: true,
            polygon: true,
            solana: false,
          },
        },
      }),
    });

    expect(result.current.chains).toEqual(["ethereum", "polygon"]);
    expect(result.current.chainFilters).toEqual({
      ethereum: true,
      polygon: true,
      solana: false,
    });
  });

  it("should filter out unsupported chains", () => {
    const mockSupportedNftCurrencies = ["ethereum", "polygon"];

    (useEnv as jest.Mock).mockReturnValue(mockSupportedNftCurrencies);

    const { result } = renderHook(() => useChains(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE_SETTINGS,
          overriddenFeatureFlags: {
            llmSolanaNfts: {
              enabled: false,
            },
          },
        },
        nft: {
          ...INITIAL_STATE_NFT,
          galleryChainFilters: {
            ...filtersFixed,
            ethereum: false,
            polygon: true,
            solana: true,
          },
        },
      }),
    });

    expect(result.current.chains).toEqual(["polygon"]);
    expect(result.current.chainFilters).toEqual({
      ethereum: false,
      polygon: true,
    });
  });

  it("should include Solana if llmSolanaNfts feature is enabled", () => {
    const mockSupportedNftCurrencies = ["ethereum", "polygon", "solana"];

    (useEnv as jest.Mock).mockReturnValue(mockSupportedNftCurrencies);

    const { result } = renderHook(() => useChains(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE_SETTINGS,
          overriddenFeatureFlags: {
            llmSolanaNfts: {
              enabled: true,
            },
          },
        },
        nft: {
          ...INITIAL_STATE_NFT,
          galleryChainFilters: {
            ...filtersFixed,
            ethereum: true,
            polygon: false,
            solana: true,
          },
        },
      }),
    });

    expect(result.current.chains).toEqual(["ethereum", "solana"]);
    expect(result.current.chainFilters).toEqual({
      ethereum: true,
      polygon: false,
      solana: true,
    });
  });

  it("should exclude Solana if llmSolanaNfts feature is disabled", () => {
    const mockSupportedNftCurrencies = ["ethereum", "polygon", "solana"];

    (useEnv as jest.Mock).mockReturnValue(mockSupportedNftCurrencies);

    const { result } = renderHook(() => useChains(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE_SETTINGS,
          overriddenFeatureFlags: {
            llmSolanaNfts: {
              enabled: false,
            },
          },
        },
        nft: {
          ...INITIAL_STATE_NFT,
          galleryChainFilters: {
            ...filtersFixed,
            ethereum: true,
            polygon: true,
            solana: true,
          },
        },
      }),
    });

    expect(result.current.chains).toEqual(["ethereum", "polygon"]);
    expect(result.current.chainFilters).toEqual({
      ethereum: true,
      polygon: true,
    });
  });
});
