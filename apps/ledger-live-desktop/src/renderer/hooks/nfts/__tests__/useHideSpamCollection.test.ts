import { updateNftStatus } from "~/renderer/actions/settings";
import { useHideSpamCollection } from "../useHideSpamCollection";
import { renderHook } from "tests/testUtils";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useDispatch } from "react-redux";
import { BlockchainEVM } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";

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
      initialState: {
        settings: {
          ...INITIAL_STATE,
          nftCollectionsStatusByNetwork: {},
        },
      },
    });
    result.current.hideSpamCollection("collectionC", BlockchainEVM.Ethereum);

    expect(mockDispatch).toHaveBeenCalledWith(
      updateNftStatus(BlockchainEVM.Ethereum, "collectionC", NftStatus.spam),
    );
  });

  it("should not dispatch hideNftCollection action if collection is already marked with a status", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: {
            [BlockchainEVM.Ethereum]: {
              collectionA: NftStatus.spam,
            },
            [BlockchainEVM.Avalanche]: {
              collectionB: NftStatus.spam,
            },
          },
          whitelistedNftCollections: ["collectionA", "collectionB"],
        },
      },
    });

    result.current.hideSpamCollection("collectionA", BlockchainEVM.Ethereum);
    result.current.hideSpamCollection("collectionB", BlockchainEVM.Avalanche);

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
