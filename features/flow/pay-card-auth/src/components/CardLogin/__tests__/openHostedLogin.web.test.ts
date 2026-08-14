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
    open.mockReturnValue({} as Window);

    await openHostedLoginInBrowser(loginUrl);

    expect(open).toHaveBeenCalledWith(loginUrl, "_blank", "noopener,noreferrer");
  });

  it("should report a dismissal, because the browser reports nothing back", async () => {
    open.mockReturnValue({} as Window);

    await expect(openHostedLoginInBrowser(loginUrl)).resolves.toEqual({ type: "dismissed" });
  });

  it("should reject when the browsing context cannot be opened", async () => {
    open.mockReturnValue(null);

    await expect(openHostedLoginInBrowser(loginUrl)).rejects.toThrow("Unable to start login");
  });
});
