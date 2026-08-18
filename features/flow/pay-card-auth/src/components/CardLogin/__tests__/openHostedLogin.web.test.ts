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

  it("should open the exact hosted login URL in a new browsing context", () => {
    open.mockReturnValue({} as Window);

    openHostedLoginInBrowser(loginUrl);

    expect(open).toHaveBeenCalledWith(loginUrl, "_blank", "noopener,noreferrer");
  });

  it("should throw when the browsing context cannot be opened", () => {
    open.mockReturnValue(null);

    expect(() => openHostedLoginInBrowser(loginUrl)).toThrow("Unable to start login");
  });
});
