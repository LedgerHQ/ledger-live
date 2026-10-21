import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getSendBalanceTypeSync } from "../../../../utils/familySendSlots";
import { useBalanceTypeSyncScreenViewModel } from "../useBalanceTypeSyncScreenViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../utils/familySendSlots", () => ({
  getSendBalanceTypeSync: jest.fn(),
}));

const mockReplace = jest.fn();
const MockSyncComponent = () => null;

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetSendBalanceTypeSync = jest.mocked(getSendBalanceTypeSync);

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
  return renderHook(() => useBalanceTypeSyncScreenViewModel());
}

describe("useBalanceTypeSyncScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockReturnValue({ replace: mockReplace } as never);
    mockedGetSendBalanceTypeSync.mockReturnValue({
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
    mockedGetSendBalanceTypeSync.mockReturnValue(undefined);

    const { result } = renderViewModel();

    expect(result.current.ready).toBe(false);
  });

  it("GIVEN a family with account sync WHEN rendered THEN its component syncs the main account", () => {
    const { result } = renderViewModel();

    expect(mockedGetSendBalanceTypeSync).toHaveBeenCalledWith("aleo");
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
