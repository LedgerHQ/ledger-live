import { render, screen, userEvent, waitFor } from "@support/jest-devtools/native";
import { SecureBrowserSection } from "./SecureBrowserSection";

const HINT = "The browser session the hosted login opens. The app's own deep link closes it.";
const URL_FIELD = "pay-card-secure-browser-url";
const OPEN_BUTTON = "Open in secure browser";
const LOGIN_URL = "https://login.card.test/authorize";

describe("SecureBrowserSection (native)", () => {
  it("should explain what the section opens before anything is tried", () => {
    render(<SecureBrowserSection open={jest.fn()} />);

    expect(screen.getByText(HINT)).toBeTruthy();
  });

  it("should refuse to open an empty URL", async () => {
    const user = userEvent.setup();
    const open = jest.fn();
    render(<SecureBrowserSection open={open} />);

    await user.press(screen.getByText(OPEN_BUTTON));

    expect(open).not.toHaveBeenCalled();
  });

  it("should refuse a URL that is only blank space", async () => {
    const user = userEvent.setup();
    const open = jest.fn();
    render(<SecureBrowserSection open={open} />);

    await user.type(screen.getByTestId(URL_FIELD), "   ");
    await user.press(screen.getByText(OPEN_BUTTON));

    expect(open).not.toHaveBeenCalled();
  });

  it("should open the trimmed URL and report what came back", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockResolvedValue("redirected to ledgerlive://pay");
    render(<SecureBrowserSection open={open} />);

    await user.type(screen.getByTestId(URL_FIELD), ` ${LOGIN_URL} `);
    await user.press(screen.getByText(OPEN_BUTTON));

    expect(open).toHaveBeenCalledWith(LOGIN_URL);
    await waitFor(() => expect(screen.getByText("redirected to ledgerlive://pay")).toBeTruthy());
    expect(screen.queryByText(HINT)).toBeNull();
  });

  it("should report why the browser refused to open", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockRejectedValue(new Error("no browser on this device"));
    render(<SecureBrowserSection open={open} />);

    await user.type(screen.getByTestId(URL_FIELD), LOGIN_URL);
    await user.press(screen.getByText(OPEN_BUTTON));

    await waitFor(() => expect(screen.getByText("failed: no browser on this device")).toBeTruthy());
  });

  it("should report a refusal that is not an Error as text", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockRejectedValue("dismissed by the system");
    render(<SecureBrowserSection open={open} />);

    await user.type(screen.getByTestId(URL_FIELD), LOGIN_URL);
    await user.press(screen.getByText(OPEN_BUTTON));

    await waitFor(() => expect(screen.getByText("failed: dismissed by the system")).toBeTruthy());
  });

  it("should hold the button while a browser session is open", async () => {
    const user = userEvent.setup();
    const open = jest.fn().mockReturnValue(new Promise<string>(() => {}));
    render(<SecureBrowserSection open={open} />);

    await user.type(screen.getByTestId(URL_FIELD), LOGIN_URL);
    await user.press(screen.getByText(OPEN_BUTTON));
    await user.press(screen.getByText(OPEN_BUTTON));

    expect(open).toHaveBeenCalledTimes(1);
  });
});
