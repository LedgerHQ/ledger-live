import { hideNftCollection } from "~/renderer/actions/settings";
import { useHideSpamCollection } from "../useHideSpamCollection";
import { renderHook } from "tests/testUtils";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useDispatch } from "react-redux";

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

  it("should dispatch hideNftCollection action if collection is not whitelisted", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          whitelistedNftCollections: ["collectionA", "collectionB"],
          hiddenNftCollections: [],
        },
      },
    });
    result.current.hideSpamCollection("collectionC");

    expect(mockDispatch).toHaveBeenCalledWith(hideNftCollection("collectionC"));
  });

  it("should not dispatch hideNftCollection action if collection is whitelisted", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      initialState: {
        settings: {
          hiddenNftCollections: [],
          whitelistedNftCollections: ["collectionA", "collectionB"],
        },
      },
    });
    result.current.hideSpamCollection("collectionA");

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
