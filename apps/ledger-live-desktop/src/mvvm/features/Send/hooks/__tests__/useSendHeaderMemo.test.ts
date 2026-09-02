import { act, renderHook } from "@testing-library/react";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useRecipientMemo } from "../../screens/Recipient/hooks/useRecipientMemo";
import { useSendHeaderMemo } from "../useSendHeaderMemo";

jest.mock("../../../FlowWizard/FlowWizardContext", () => ({ useFlowWizard: jest.fn() }));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
  useSendFlowActions: jest.fn(),
}));
jest.mock("../../screens/Recipient/hooks/useRecipientMemo", () => ({
  useRecipientMemo: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: {
    hasMemoForRecipient: jest.fn(() => true),
    getMemoDefaultOption: jest.fn(() => undefined),
  },
}));
jest.mock("@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId", () => ({
  getMemoFamilyCurrencyId: jest.fn(() => "ripple"),
}));

import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";
import { track } from "~/renderer/analytics/segment";

const mockedUseFlowWizard = jest.mocked(useFlowWizard);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseRecipientMemo = jest.mocked(useRecipientMemo);

const setRecipient = jest.fn();
const goToNextStep = jest.fn();

function mockFlow({
  searchValue,
  recipient,
  isRecipientAddressComplete = true,
}: {
  searchValue: string;
  recipient: { address: string } | null;
  isRecipientAddressComplete?: boolean;
}) {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: {
        account: { id: "ripple-account" },
        parentAccount: null,
        currency: { id: "ripple" },
      },
      recipient,
    } as never,
    uiConfig: { hasMemo: true, memoType: "text", memoOptions: [] } as never,
    recipientSearch: { value: searchValue, setValue: jest.fn(), clear: jest.fn() },
    isRecipientAddressComplete,
  });
  mockedUseSendFlowActions.mockReturnValue({
    transaction: { setRecipient },
  } as never);
  mockedUseFlowWizard.mockReturnValue({
    navigation: { goToNextStep },
  } as never);
}

describe("useSendHeaderMemo", () => {
  let onMemoChange: ((memo: Memo) => void) | undefined;
  let onMemoSkip: (() => void) | undefined;
  let resetKey: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    onMemoChange = undefined;
    onMemoSkip = undefined;
    resetKey = undefined;
    mockedUseRecipientMemo.mockImplementation(props => {
      onMemoChange = props.onMemoChange;
      onMemoSkip = props.onMemoSkip;
      resetKey = props.resetKey;
      return {
        hasMemoTypeOptions: false,
        memo: { value: "", type: undefined },
        onMemoTypeChange: jest.fn(),
        showMemoValueInput: true,
        onMemoValueChange: jest.fn(),
        showSkipMemo: true,
        skipMemoState: "propose",
        hasFilledMemo: false,
        onSkipMemoRequestConfirm: jest.fn(),
        onSkipMemoCancelConfirm: jest.fn(),
        onSkipMemoConfirm: jest.fn(),
        resetViewState: jest.fn(),
      };
    });
  });

  it("should persist the current search recipient when skipping memo after editing", () => {
    mockFlow({
      searchValue: "rNewRecipient",
      recipient: { address: "rOldRecipient" },
    });

    renderHook(() => useSendHeaderMemo());

    act(() => {
      onMemoChange?.({ value: "", type: "NO_MEMO" });
    });

    expect(setRecipient).toHaveBeenCalledWith({
      address: "rNewRecipient",
      ensName: undefined,
      memo: { value: "", type: "NO_MEMO" },
    });
  });

  it("should keep the committed recipient when the search still matches it", () => {
    mockFlow({
      searchValue: "rOldRecipient",
      recipient: { address: "rOldRecipient" },
    });

    renderHook(() => useSendHeaderMemo());

    act(() => {
      onMemoChange?.({ value: "123", type: undefined });
    });

    expect(setRecipient).toHaveBeenCalledWith({
      address: "rOldRecipient",
      ensName: undefined,
      memo: { value: "123", type: undefined },
    });
  });

  it("should include the complete search address in the memo reset key", () => {
    mockFlow({
      searchValue: "rNewRecipient",
      recipient: { address: "rOldRecipient" },
      isRecipientAddressComplete: true,
    });

    renderHook(() => useSendHeaderMemo());

    expect(resetKey).toBe("ripple-account|ripple|rNewRecipient");
  });

  it("should disable memo state when the recipient does not support memos", () => {
    jest.mocked(sendFeatures.hasMemoForRecipient).mockReturnValue(false);
    mockFlow({
      searchValue: "rTransparentRecipient",
      recipient: null,
    });

    renderHook(() => useSendHeaderMemo());

    expect(sendFeatures.hasMemoForRecipient).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ripple" }),
      "rTransparentRecipient",
    );
    expect(mockedUseRecipientMemo).toHaveBeenCalledWith(
      expect.objectContaining({ hasMemo: false }),
    );
  });

  it("should go to the next step when skipping memo", () => {
    mockFlow({
      searchValue: "rNewRecipient",
      recipient: { address: "rOldRecipient" },
    });

    renderHook(() => useSendHeaderMemo());

    act(() => {
      onMemoSkip?.();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "skip memo", page: "step recipient" }),
    );
    expect(goToNextStep).toHaveBeenCalledTimes(1);
  });
});
