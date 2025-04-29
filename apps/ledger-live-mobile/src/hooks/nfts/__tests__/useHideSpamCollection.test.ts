import { useHideSpamCollection } from "../useHideSpamCollection";
import { useDispatch } from "react-redux";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";
import { renderHook } from "@tests/test-renderer";
import { INITIAL_STATE } from "~/reducers/settings";
import { updateNftStatus } from "~/actions/settings";
import { State } from "~/reducers/types";
import { nftCollectionsStatusByNetwork } from "./shared";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: jest.fn(),
}));

const mockDispatch = jest.fn();

describe("useHideSpamCollection", () => {
  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    mockDispatch.mockClear();
  });

  it("should dispatch updateNftStatus action if collection is not already marked with a status", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
          nftCollectionsStatusByNetwork,
        },
      }),
    });
    result.current.hideSpamCollection("collectionC", SupportedBlockchain.Ethereum);

    expect(mockDispatch).toHaveBeenCalledWith(
      updateNftStatus({
        blockchain: SupportedBlockchain.Ethereum,
        collection: "collectionC",
        status: NftStatus.spam,
      }),
    );
  });

  it("should not dispatch hideNftCollection action if collection is already marked with a status", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
          nftCollectionsStatusByNetwork: {
            ...nftCollectionsStatusByNetwork,
            [SupportedBlockchain.Ethereum]: {
              collectionA: NftStatus.spam,
            },
            [SupportedBlockchain.Avalanche]: {
              collectionB: NftStatus.spam,
            },
          },
        },
      }),
    });

    result.current.hideSpamCollection("collectionA", SupportedBlockchain.Ethereum);
    result.current.hideSpamCollection("collectionB", SupportedBlockchain.Avalanche);

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
