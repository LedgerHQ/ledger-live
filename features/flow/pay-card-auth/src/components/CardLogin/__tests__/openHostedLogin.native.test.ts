import { openAuthSessionAsync } from "expo-web-browser";
import { openHostedLoginInSecureBrowser } from "../openHostedLogin.native";

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

const mockedOpenAuthSessionAsync = jest.mocked(openAuthSessionAsync);

const loginUrl =
  "https://card.example.com/login?request=opaque%2Bvalue&redirect_uri=ledgerlive%3A%2F%2Fpaytab";
const deepLink = "ledgerlive://paytab";

describe("openHostedLoginInSecureBrowser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the exact hosted login URL in the secure auth browser", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: deepLink });

    await openHostedLoginInSecureBrowser(loginUrl, deepLink);

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledWith(loginUrl, deepLink);
  });

  it("should report the redirect the session ended on", async () => {
    const callbackUrl = `${deepLink}?code=auth-code&state=state-value`;
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: callbackUrl });

    await expect(openHostedLoginInSecureBrowser(loginUrl, deepLink)).resolves.toEqual({
      type: "success",
      url: callbackUrl,
    });
  });

  // The whole non-success half of `WebBrowserAuthSessionResult`. `openAuthSessionAsync` never answers
  // `opened`: Android races the deep link against a browser wait, and the Android polyfill turns that
  // internal `opened` into the wait itself, then answers `dismiss`. The type still permits the value,
  // because `WebBrowserResult` also serves `openBrowserAsync`, so the mapping covers it.
  it.each(["cancel", "dismiss", "opened", "locked"] as const)(
    "should report a dismissal when the session ends with %s",
    async type => {
      mockedOpenAuthSessionAsync.mockResolvedValue({
        type,
      } as Awaited<ReturnType<typeof openAuthSessionAsync>>);

      await expect(openHostedLoginInSecureBrowser(loginUrl, deepLink)).resolves.toEqual({
        type: "dismissed",
      });
    },
  );
});
