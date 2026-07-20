import { renderHook, waitFor } from "@tests/test-renderer";
import { payCardInitialState } from "@domain/entity-pay-card";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { usePayTabScreenViewModel } from "../usePayTabScreenViewModel";

const mockPush = jest.fn();
const mockGetParent = jest.fn(() => ({ push: mockPush }));

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: () => ({ getParent: mockGetParent }),
}));

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 0 }),
}));

const loginUrl = "https://card.withcl.com/login";

describe("usePayTabScreenViewModel", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetParent.mockClear();
    mockGetParent.mockReturnValue({ push: mockPush });
  });

  it("does not navigate when Pay Card has no login URL", () => {
    renderHook(() => usePayTabScreenViewModel(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        payCard: payCardInitialState,
      }),
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens the Pay Card Web3Hub app route on the pre-auth login URL", async () => {
    const { store } = renderHook(() => usePayTabScreenViewModel(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        payCard: {
          loginUrl,
        },
      }),
    });

    await waitFor(() => {
      expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
      expect(mockPush).toHaveBeenCalledWith(NavigatorName.Web3Hub, {
        screen: ScreenName.Web3HubApp,
        params: { manifestId: "cl-card" },
      });
      expect(store.getState().payCard).toEqual(payCardInitialState);
    });
  });

  it("clears the login URL when the base navigator is unavailable", async () => {
    mockGetParent.mockReturnValue(undefined as never);

    const { store } = renderHook(() => usePayTabScreenViewModel(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        payCard: {
          loginUrl,
        },
      }),
    });

    await waitFor(() => {
      expect(store.getState().payCard).toEqual(payCardInitialState);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
