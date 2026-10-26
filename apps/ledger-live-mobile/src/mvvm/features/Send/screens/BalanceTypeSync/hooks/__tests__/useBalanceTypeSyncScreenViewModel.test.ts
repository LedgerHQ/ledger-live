import { renderHook } from "@tests/test-renderer";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getSendBalanceTypeSync } from "../../../../utils/familySendSlots";
import { useBalanceTypeSyncScreenViewModel } from "../useBalanceTypeSyncScreenViewModel";

jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../utils/familySendSlots", () => ({
  getSendBalanceTypeSync: jest.fn(),
}));

const MockSyncComponent = () => null;

const mockedUseSendFlowData = jest.mocked(useSendFlowData);
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
    });
  });
});
