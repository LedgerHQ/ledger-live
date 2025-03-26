import { updateNftStatus } from "~/renderer/actions/settings";
import { useHideSpamCollection } from "../useHideSpamCollection";
import { renderHook } from "tests/testUtils";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useDispatch } from "react-redux";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
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
    result.current.hideSpamCollection("collectionC", SupportedBlockchain.Ethereum);

    expect(mockDispatch).toHaveBeenCalledWith(
      updateNftStatus(SupportedBlockchain.Ethereum, "collectionC", NftStatus.spam),
    );
  });

  it("should not dispatch hideNftCollection action if collection is already marked with a status", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: {
            [SupportedBlockchain.Ethereum]: {
              collectionA: NftStatus.spam,
            },
            [SupportedBlockchain.Avalanche]: {
              collectionB: NftStatus.spam,
            },
          },
        },
      },
    });

    result.current.hideSpamCollection("collectionA", SupportedBlockchain.Ethereum);
    result.current.hideSpamCollection("collectionB", SupportedBlockchain.Avalanche);

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
