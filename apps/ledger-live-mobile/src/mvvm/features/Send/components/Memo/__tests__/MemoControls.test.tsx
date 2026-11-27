import React, { useState } from "react";
import { MemoTooLong } from "@ledgerhq/live-common/errors";
import { DEFAULT_SEND_UI_CONFIG } from "@ledgerhq/live-common/flows/send/uiConfig";
import { render, screen } from "@tests/test-renderer";
import { MemoControls } from "../MemoControls";
import type { useMemoViewModel } from "../hooks/useMemoViewModel";

type MemoViewModel = ReturnType<typeof useMemoViewModel>;

const MEMO_MAX_LENGTH = 5;

function buildViewModel(overrides: Partial<MemoViewModel> = {}): MemoViewModel {
  return {
    memo: { value: "", type: undefined },
    hasMemoTypeOptions: false,
    showMemoValueInput: true,
    showSkipMemo: false,
    skipMemoState: "propose",
    hasFilledMemo: false,
    onMemoValueChange: jest.fn(),
    onMemoTypeChange: jest.fn(),
    onSkipMemoRequestConfirm: jest.fn(),
    onSkipMemoCancelConfirm: jest.fn(),
    onSkipMemoConfirm: jest.fn(),
    resetViewState: jest.fn(),
    currencyId: "mina",
    memoLabel: "Memo",
    memoTypeOptions: [],
    uiConfig: {
      ...DEFAULT_SEND_UI_CONFIG,
      hasMemo: true,
      memoType: "text",
      memoMaxLength: MEMO_MAX_LENGTH,
    },
    memoError: undefined,
    ...overrides,
  };
}

function StatefulMemoControls({ onMemoValueChange }: { onMemoValueChange: jest.Mock }) {
  const [value, setValue] = useState("");
  const vm = buildViewModel({
    memo: { value, type: undefined },
    onMemoValueChange: nextValue => {
      onMemoValueChange(nextValue);
      setValue(nextValue);
    },
  });
  return <MemoControls vm={vm} />;
}

describe("MemoControls", () => {
  it("should keep a memo longer than the coin's memo limit whole", async () => {
    const onMemoValueChange = jest.fn();
    const { user } = render(<StatefulMemoControls onMemoValueChange={onMemoValueChange} />);

    await user.type(screen.getByTestId("send-memo-input"), "deposit-42");

    expect(onMemoValueChange).toHaveBeenLastCalledWith("deposit-42");
  });

  it("should show the memo length against the limit when the memo is too long", () => {
    render(
      <MemoControls
        vm={buildViewModel({
          memo: { value: "deposit-42", type: undefined },
          memoError: new MemoTooLong(10, MEMO_MAX_LENGTH),
        })}
      />,
    );

    expect(screen.getByText("Memo is too long (10/5 bytes)")).toBeVisible();
  });
});
