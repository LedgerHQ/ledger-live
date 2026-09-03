import { fireEvent, render, screen, userEvent, waitFor } from "@support/jest-devtools/native";
import { SecureBrowserSection } from "./SecureBrowserSection";

const BUTTON = "Open in secure browser";
const HINT = "The browser session the hosted login opens. The app's own deep link closes it.";
const URL_INPUT = "pay-card-secure-browser-url";

function typeUrl(url: string) {
  fireEvent.changeText(screen.getByTestId(URL_INPUT), url);
}

describe("SecureBrowserSection (native)", () => {
  it("opens the URL a tester types, trimmed", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockResolvedValue("dismissed");
    render(<SecureBrowserSection open={open} />);

    typeUrl("  https://card.example/authorize  ");
    await user.press(screen.getByText(BUTTON));

    expect(open).toHaveBeenCalledWith("https://card.example/authorize");
  });

  it("reports what the browser answered", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockResolvedValue("redirected to ledgerlive://paytab?code=abc");
    render(<SecureBrowserSection open={open} />);

    typeUrl("https://card.example/authorize");
    await user.press(screen.getByText(BUTTON));

    await waitFor(() =>
      expect(screen.getByText("redirected to ledgerlive://paytab?code=abc")).toBeTruthy(),
    );
  });

  it("reports a browser that threw", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockRejectedValue(new Error("no browser"));
    render(<SecureBrowserSection open={open} />);

    typeUrl("https://card.example/authorize");
    await user.press(screen.getByText(BUTTON));

    await waitFor(() => expect(screen.getByText("failed: no browser")).toBeTruthy());
  });

  it("offers no action without a URL", async () => {
    const user = userEvent.setup();
    const open = jest.fn();
    render(<SecureBrowserSection open={open} />);

    expect(screen.getByText(HINT)).toBeTruthy();
    await user.press(screen.getByText(BUTTON));

    expect(open).not.toHaveBeenCalled();
  });
});
