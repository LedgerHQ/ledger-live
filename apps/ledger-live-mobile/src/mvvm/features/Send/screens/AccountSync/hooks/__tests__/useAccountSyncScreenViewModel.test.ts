import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getSendAccountSync } from "../../../../utils/familySendSlots";
import { useAccountSyncScreenViewModel } from "../useAccountSyncScreenViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../utils/familySendSlots", () => ({
  getSendAccountSync: jest.fn(),
}));

const mockReplace = jest.fn();
const MockSyncComponent = () => null;

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetSendAccountSync = jest.mocked(getSendAccountSync);

const mockAccount = {
  id: "aleo-account",
  type: "Account",
  currency: { id: "aleo", family: "aleo", type: "CryptoCurrency", units: [] },
};

function mockFlowState(account: typeof mockAccount | null = mockAccount) {
  mockedUseSendFlowData.mockReturnValue({
    state: { account: { account, parentAccount: null } },
  } as never);
}

function renderViewModel() {
  return renderHook(() => useAccountSyncScreenViewModel());
}

describe("useAccountSyncScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockReturnValue({ replace: mockReplace } as never);
    mockedGetSendAccountSync.mockReturnValue({
      isRequired: jest.fn(() => true),
      Component: MockSyncComponent,
    });
    mockFlowState();
  });

  it("GIVEN no account WHEN rendered THEN the view model is not ready", () => {
    mockFlowState(null);

    const { result } = renderViewModel();

    expect(result.current.ready).toBe(false);
  });

  it("GIVEN a family without account sync WHEN rendered THEN the view model is not ready", () => {
    mockedGetSendAccountSync.mockReturnValue(undefined);

    const { result } = renderViewModel();

    expect(result.current.ready).toBe(false);
  });

  it("GIVEN a family with account sync WHEN rendered THEN its component syncs the main account", () => {
    const { result } = renderViewModel();

    expect(mockedGetSendAccountSync).toHaveBeenCalledWith("aleo");
    expect(result.current).toMatchObject({
      ready: true,
      account: mockAccount,
      SyncComponent: MockSyncComponent,
    });
  });

  it("GIVEN a running sync WHEN it completes THEN the recipient step replaces the sync step", () => {
    const { result } = renderViewModel();
    const viewModel = result.current;
    if (!viewModel.ready) throw new Error("view model not ready");

    act(() => viewModel.onComplete());

    expect(mockReplace).toHaveBeenCalledWith(ScreenName.SendFlowRecipient);
  });
});
