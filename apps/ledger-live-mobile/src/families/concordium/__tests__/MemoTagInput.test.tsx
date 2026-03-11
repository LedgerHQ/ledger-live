import React from "react";
import { render, screen } from "@tests/test-renderer";
import MemoTagInput from "../MemoTagInput";

describe("MemoTagInput (Concordium)", () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the memo input", () => {
    render(<MemoTagInput onChange={onChange} />);
    expect(screen.getByTestId("memo-tag-input")).toBeDefined();
  });

  it("should call onChange with a transaction patch that sets memo", async () => {
    const { user } = render(<MemoTagInput onChange={onChange} />);

    await user.type(screen.getByTestId("memo-tag-input"), "hello");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.value).toBe("hello");

    const tx = { memo: undefined, amount: 100 };
    const patched = lastCall.patch(tx);
    expect(patched.memo).toBe("hello");
    expect(patched.amount).toBe(100);
  });

  it("should set memo to undefined when value is empty", async () => {
    const { user } = render(<MemoTagInput onChange={onChange} />);

    await user.type(screen.getByTestId("memo-tag-input"), "a");
    await user.clear(screen.getByTestId("memo-tag-input"));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    const tx = { memo: "old", amount: 100 };
    const patched = lastCall.patch(tx);
    expect(patched.memo).toBeUndefined();
  });
});
