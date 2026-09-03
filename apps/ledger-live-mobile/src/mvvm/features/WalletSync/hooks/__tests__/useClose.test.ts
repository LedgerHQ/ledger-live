import { act, renderHook } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import { INITIAL_STATE as WALLET_SYNC_INITIAL_STATE } from "~/reducers/walletSync";
import { useClose } from "../useClose";

const mockPopToTop = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    popToTop: mockPopToTop,
    goBack: mockGoBack,
    replace: mockReplace,
  }),
}));

function renderClose(returnsToEntryScreen: boolean) {
  return renderHook(() => useClose(), {
    overrideInitialState: state => ({
      ...state,
      walletSync: { ...WALLET_SYNC_INITIAL_STATE, returnsToEntryScreen },
    }),
  });
}

describe("useClose", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should go back to the entry screen when the flow was started from it", () => {
    const { result, store } = renderClose(true);

    act(() => {
      result.current();
    });

    expect(mockPopToTop).toHaveBeenCalledTimes(1);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(store.getState().walletSync.returnsToEntryScreen).toBe(false);
  });

  it("should replace with the main navigator otherwise", () => {
    const { result } = renderClose(false);

    act(() => {
      result.current();
    });

    expect(mockReplace).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
    expect(mockPopToTop).not.toHaveBeenCalled();
  });
});
