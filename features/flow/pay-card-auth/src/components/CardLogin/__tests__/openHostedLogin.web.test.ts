import { openHostedLoginInBrowser } from "../openHostedLogin.web";

const loginUrl =
  "https://card.example.com/login?request=opaque%2Bvalue&redirect_uri=ledgerlive%3A%2F%2Fpaytab";

describe("openHostedLoginInBrowser", () => {
  let open: jest.SpyInstance;

  beforeEach(() => {
    open = jest.spyOn(window, "open");
  });

  afterEach(() => {
    open.mockRestore();
  });

  it("should open the exact hosted login URL in a new browsing context", async () => {
    // `noopener` is what keeps the hosted page away from `window.opener`.
    open.mockReturnValue(null);

    await openHostedLoginInBrowser(loginUrl);

    expect(open).toHaveBeenCalledWith(loginUrl, "_blank", "noopener,noreferrer");
  });

  it("should report a dismissal, because the browser reports nothing back", async () => {
    // `noopener` makes the answer `null` for every login, so it cannot report a failure.
    open.mockReturnValue(null);

    await expect(openHostedLoginInBrowser(loginUrl)).resolves.toEqual({ type: "dismissed" });
  });

  it("should reject when the platform refuses to open a context at all", async () => {
    open.mockImplementation(() => {
      throw new Error("blocked");
    });

    // The machine turns a throw into `browser_open_failed`.
    await expect(openHostedLoginInBrowser(loginUrl)).rejects.toThrow("blocked");
  });
});
