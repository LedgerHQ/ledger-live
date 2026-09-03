import { act, render, screen, userEvent } from "@support/jest-devtools/native";
import { ResultToast } from "./ResultToast";

const result = { id: 1, message: "token → at_mock_1", failed: false };

describe("ResultToast (native)", () => {
  it("shows nothing until an action answers", () => {
    render(<ResultToast result={null} />);

    expect(screen.queryByText(result.message)).toBeNull();
  });

  it("shows what the last action answered", () => {
    render(<ResultToast result={result} />);

    expect(screen.getByText(result.message)).toBeTruthy();
  });

  it("gets out of the way on its own", () => {
    jest.useFakeTimers();
    render(<ResultToast result={result} />);

    expect(screen.getByText(result.message)).toBeTruthy();
    act(() => jest.advanceTimersByTime(5000));

    expect(screen.queryByText(result.message)).toBeNull();
    jest.useRealTimers();
  });

  it("re-opens when the same message answers again", () => {
    jest.useFakeTimers();
    const { rerender } = render(<ResultToast result={result} />);
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.queryByText(result.message)).toBeNull();

    rerender(<ResultToast result={{ ...result, id: 2 }} />);

    expect(screen.getByText(result.message)).toBeTruthy();
    jest.useRealTimers();
  });

  it("closes when the tester dismisses it", async () => {
    const user = userEvent.setup();
    render(<ResultToast result={{ ...result, failed: true, message: "renew failed" }} />);

    await user.press(screen.getByRole("button"));

    expect(screen.queryByText("renew failed")).toBeNull();
  });
});
