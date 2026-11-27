import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { act, renderHook } from "@tests/test-renderer";
import { setReadOnlyMode } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { XRP_ACCOUNT_WITH_TOKEN } from "~/families/xrp/__mocks__/account.mock";
import { useAccountDetailViewModel } from "../useAccountDetailViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ params: {} }),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({
    account: jest.requireActual("~/families/xrp/__mocks__/account.mock").XRP_ACCOUNT_WITH_TOKEN,
  }),
}));

jest.mock("../useAccountRefresh", () => ({ useAccountRefresh: () => ({}) }));
jest.mock("../useDeferredAccountRemoval", () => ({ useDeferredAccountRemoval: () => jest.fn() }));

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));

const manageAssetsRoute = [
  NavigatorName.XrpManageTokenFlow,
  {
    screen: ScreenName.XrpManageTokenList,
    params: { accountId: XRP_ACCOUNT_WITH_TOKEN.id },
  },
];

function renderViewModel() {
  const view = renderHook(() => useAccountDetailViewModel());
  act(() => {
    view.store.dispatch(setReadOnlyMode(false));
  });
  return view;
}

describe("useAccountDetailViewModel manage assets", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
  });

  it("closes the settings sheet on tap and opens Manage assets once the sheet is hidden", () => {
    const { result } = renderViewModel();

    act(() => result.current.onOpenSettings());
    expect(result.current.isSettingsOpen).toBe(true);

    act(() => result.current.onManageAssets?.());

    expect(result.current.isSettingsOpen).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalledWith(...manageAssetsRoute);

    act(() => result.current.onSettingsHidden());

    expect(mockNavigate).toHaveBeenCalledWith(...manageAssetsRoute);
  });

  it("opens Manage assets only once for a single tap", () => {
    const { result } = renderViewModel();

    act(() => result.current.onManageAssets?.());
    act(() => result.current.onSettingsHidden());
    act(() => result.current.onSettingsHidden());

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("offers no Manage assets action in read-only mode", () => {
    const { result, store } = renderViewModel();
    expect(result.current.onManageAssets).toBeDefined();

    act(() => {
      store.dispatch(setReadOnlyMode(true));
    });

    expect(result.current.onManageAssets).toBeUndefined();
  });
});
