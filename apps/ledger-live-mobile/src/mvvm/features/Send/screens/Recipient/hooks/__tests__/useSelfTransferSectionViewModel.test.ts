import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { getAccountSelfTransferTarget } from "../../../../utils/selfTransferTarget";
import { useSelfTransferSectionViewModel } from "../useSelfTransferSectionViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../utils/selfTransferTarget");

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedGetAccountSelfTransferTarget = jest.mocked(getAccountSelfTransferTarget);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockGetState = jest.fn();
const mockSetRecipient = jest.fn();
const mockClearSearch = jest.fn();

const account = { id: "aleo-account", type: "Account" };
const transaction = { family: "aleo" };
const existingRecipient = { address: "aleo1someoneelse", memo: { value: "kept" } };

const toPrivateTarget = {
  address: "aleo1self",
  translationKey: "recipient.selfTransfer.toPrivate",
  isDestinationPublic: false,
};

describe("useSelfTransferSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ routes: [{ name: ScreenName.SendFlowRecipient }], index: 0 });
    mockedUseNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: mockGoBack,
      getState: mockGetState,
    } as never);
    mockedUseSendFlowData.mockReturnValue({
      state: {
        account: { account },
        transaction: { transaction },
        recipient: existingRecipient,
      },
      recipientSearch: { value: "", setValue: jest.fn(), clear: mockClearSearch },
    } as never);
    mockedUseSendFlowActions.mockReturnValue({
      transaction: { setRecipient: mockSetRecipient },
    } as never);
    mockedGetAccountSelfTransferTarget.mockReturnValue(toPrivateTarget);
  });

  it("GIVEN an account without another balance pool WHEN rendered THEN no section is offered", () => {
    mockedGetAccountSelfTransferTarget.mockReturnValue(null);

    const { result } = renderHook(() => useSelfTransferSectionViewModel());

    expect(result.current).toBeNull();
  });

  it("GIVEN an account with another balance pool WHEN rendered THEN the section names the destination", () => {
    const { result } = renderHook(() => useSelfTransferSectionViewModel());

    expect(mockedGetAccountSelfTransferTarget).toHaveBeenCalledWith(account, transaction);
    expect(result.current?.target).toBe(toPrivateTarget);
    expect(result.current?.title).toBe("Self transfer");
    expect(result.current?.actionLabel).toBe("Send to private balance");
  });

  it("GIVEN the section WHEN it is pressed THEN the own pool becomes a self-transfer recipient and the amount step opens", () => {
    const { result } = renderHook(() => useSelfTransferSectionViewModel());

    act(() => result.current?.onSelfTransfer());

    expect(mockSetRecipient).toHaveBeenCalledWith({
      ...existingRecipient,
      address: "aleo1self",
      displayLabel: "Private balance",
      ensName: undefined,
      isSelfTransfer: true,
    });
    expect(mockClearSearch).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendFlowAmount);
  });

  it("GIVEN the amount step below the recipient WHEN the section is pressed THEN the flow goes back to it", () => {
    mockGetState.mockReturnValue({
      routes: [{ name: ScreenName.SendFlowAmount }, { name: ScreenName.SendFlowRecipient }],
      index: 1,
    });
    const { result } = renderHook(() => useSelfTransferSectionViewModel());

    act(() => result.current?.onSelfTransfer());

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
