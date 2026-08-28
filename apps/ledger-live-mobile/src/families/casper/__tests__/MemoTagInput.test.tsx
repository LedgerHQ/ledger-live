import React from "react";
import { render, screen } from "@tests/test-renderer";
import MemoTagInput from "../MemoTagInput";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("MemoTagInput (Casper)", () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the memo tag input", () => {
    render(<MemoTagInput onChange={onChange} />);
    expect(screen.getByTestId("memo-tag-input")).toBeDefined();
  });

  it("strips non-digit characters and calls onChange with the patch", async () => {
    const { user } = render(<MemoTagInput onChange={onChange} />);

    await user.type(screen.getByTestId("memo-tag-input"), "abc123");

    expect(onChange).toHaveBeenCalledTimes(6);
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.value).toBe("123");

    const tx = { family: "casper", transferId: undefined, memoType: null, memoValue: null };
    const patched = lastCall.patch(tx);
    expect(patched.transferId).toBe("123");
    expect(patched.memoType).toBe("transferId");
    expect(patched.memoValue).toBe("123");
  });

  it("sets transferId to undefined when no digits remain", async () => {
    const { user } = render(<MemoTagInput onChange={onChange} />);

    await user.type(screen.getByTestId("memo-tag-input"), "a");
    await user.clear(screen.getByTestId("memo-tag-input"));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    const tx = { family: "casper", transferId: "99", memoType: "transferId", memoValue: "99" };
    const patched = lastCall.patch(tx);
    expect(patched.transferId).toBeUndefined();
    expect(patched.memoType).toBeNull();
    expect(patched.memoValue).toBeNull();
  });
});
