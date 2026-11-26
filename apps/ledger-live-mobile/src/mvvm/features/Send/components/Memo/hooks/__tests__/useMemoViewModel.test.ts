import { renderHook } from "@testing-library/react-native";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { useSendMemoReset } from "../../../../context/SendMemoResetContext";
import { useMemoViewModel } from "../useMemoViewModel";
import { useRecipientMemo } from "../useRecipientMemo";

jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../context/SendMemoResetContext");
jest.mock("../useRecipientMemo");
jest.mock("~/context/Locale", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const keptMemo = { value: "x".repeat(65) };

function renderForAddress(
  address: string,
  { memo = keptMemo, memoError }: { memo?: object; memoError?: Error } = {},
) {
  jest.mocked(useSendFlowData).mockReturnValue({
    state: {
      account: { account: { id: "acc" }, currency: { id: "solana", family: "solana" } },
      recipient: { address: "kept_address", memo },
      transaction: { status: { errors: memoError ? { transaction: memoError } : {} } },
    },
    uiConfig: { memoType: "text" },
  } as never);
  jest
    .mocked(useSendFlowActions)
    .mockReturnValue({ transaction: { setRecipient: jest.fn() } } as never);
  jest.mocked(useSendMemoReset).mockReturnValue({ registerResetViewState: jest.fn() } as never);
  jest.mocked(useRecipientMemo).mockReturnValue({ resetViewState: jest.fn() } as never);
  renderHook(() => useMemoViewModel({ address, hasMemo: true }));
  return jest.mocked(useRecipientMemo).mock.lastCall?.[0];
}

describe("useMemoViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("restores a kept memo that still fails validation so it can be fixed", () => {
    const restoredMemo = renderForAddress("kept_address", {
      memoError: new Error("MemoTooLong"),
    })?.restoredMemo;

    expect(restoredMemo).toBe(keptMemo);
  });

  it("starts from the default memo when the kept memo is valid", () => {
    expect(renderForAddress("kept_address")?.restoredMemo).toBeUndefined();
  });

  it("starts from the default memo after the memo was skipped", () => {
    const skipped = { value: "", type: "NO_MEMO" };

    expect(
      renderForAddress("kept_address", { memo: skipped, memoError: new Error("any") })
        ?.restoredMemo,
    ).toBeUndefined();
  });

  it("starts another address from the default memo", () => {
    const restoredMemo = renderForAddress("other_address", {
      memoError: new Error("MemoTooLong"),
    })?.restoredMemo;

    expect(restoredMemo).toBeUndefined();
  });
});
