import { useHideSpamCollection } from "../useHideSpamCollection";
import { useDispatch } from "react-redux";
import { renderHook } from "@tests/test-renderer";
import { hideNftCollection } from "~/actions/settings";
import { State } from "~/reducers/types";

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
    const { result } = renderHook(
      () => useHideSpamCollection(),

      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            whitelistedNftCollections: ["collectionA", "collectionB"],
            hiddenNftCollections: [],
          },
        }),
      },
    );
    result.current.hideSpamCollection("collectionC");

    expect(mockDispatch).toHaveBeenCalledWith(hideNftCollection("collectionC"));
  });

  it("should not dispatch hideNftCollection action if collection is whitelisted", () => {
    const { result } = renderHook(() => useHideSpamCollection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          hiddenNftCollections: [],
          whitelistedNftCollections: ["collectionA", "collectionB"],
        },
      }),
    });
    result.current.hideSpamCollection("collectionA");

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
