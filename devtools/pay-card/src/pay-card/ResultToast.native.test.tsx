import { act, render, screen, userEvent } from "@support/jest-devtools/native";
import { ResultToast } from "./ResultToast";

const VISIBLE_MS = 5000;

const RESULT = { id: 1, message: "renew → refreshed at_new_12…", failed: false };

describe("ResultToast (native)", () => {
  it("should show nothing until an action reports", () => {
    render(<ResultToast result={null} />);

    expect(screen.queryByText(RESULT.message)).toBeNull();
  });

  it("should show what the action answered", () => {
    render(<ResultToast result={RESULT} />);

    expect(screen.getByText(RESULT.message)).toBeTruthy();
  });

  it("should hide itself once the message has been read", () => {
    jest.useFakeTimers();
    try {
      render(<ResultToast result={RESULT} />);

      act(() => {
        jest.advanceTimersByTime(VISIBLE_MS);
      });

      expect(screen.queryByText(RESULT.message)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("should stay while the message is still fresh", () => {
    jest.useFakeTimers();
    try {
      render(<ResultToast result={RESULT} />);

      act(() => {
        jest.advanceTimersByTime(VISIBLE_MS - 1);
      });

      expect(screen.getByText(RESULT.message)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it("should close when the tester dismisses it", async () => {
    const user = userEvent.setup();
    render(<ResultToast result={RESULT} />);

    await user.press(screen.getByLabelText("Close"));

    expect(screen.queryByText(RESULT.message)).toBeNull();
  });

  it("should replace the message when the next action reports", () => {
    const { rerender } = render(<ResultToast result={RESULT} />);

    rerender(<ResultToast result={{ id: 2, message: "clear → cleared", failed: false }} />);

    expect(screen.getByText("clear → cleared")).toBeTruthy();
    expect(screen.queryByText(RESULT.message)).toBeNull();
  });

  it("should drop the message when the action list is reset", () => {
    const { rerender } = render(<ResultToast result={RESULT} />);

    rerender(<ResultToast result={null} />);

    expect(screen.queryByText(RESULT.message)).toBeNull();
  });

  it("should show a failure differently from an answer", () => {
    render(<ResultToast result={{ id: 3, message: "renew failed: 400", failed: true }} />);

    expect(screen.getByText("renew failed: 400")).toBeTruthy();
  });
});
