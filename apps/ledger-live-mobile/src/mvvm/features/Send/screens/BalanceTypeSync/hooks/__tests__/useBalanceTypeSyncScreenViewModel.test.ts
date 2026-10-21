import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
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
const mockClose = jest.fn();
const MockSyncComponent = () => null;

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedGetSendBalanceTypeSync = jest.mocked(getSendBalanceTypeSync);

const mockAccount = {
  id: "aleo-account",
  type: "Account",
  currency: { id: "aleo", family: "aleo", type: "CryptoCurrency", units: [] },
};

const mockTransaction = { family: "aleo", mode: "transfer_private" };

function mockFlowState(
  account: typeof mockAccount | null = mockAccount,
  transaction: typeof mockTransaction | null = mockTransaction,
) {
  mockedUseSendFlowData.mockReturnValue({
    state: { account: { account, parentAccount: null }, transaction: { transaction } },
  } as never);
}

function renderViewModel() {
  return renderHook(() => useBalanceTypeSyncScreenViewModel());
}

describe("useBalanceTypeSyncScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockReturnValue({ replace: mockReplace } as never);
    mockedUseSendFlowActions.mockReturnValue({ close: mockClose } as never);
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

  it("GIVEN no transaction WHEN rendered THEN the view model is not ready", () => {
    mockFlowState(mockAccount, null);

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
      transaction: mockTransaction,
      SyncComponent: MockSyncComponent,
      onClose: mockClose,
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
