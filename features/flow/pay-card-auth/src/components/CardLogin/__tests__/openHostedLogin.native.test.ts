import { openAuthSessionAsync } from "expo-web-browser";
import { openHostedLoginInSecureBrowser } from "../openHostedLogin.native";

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

const mockedOpenAuthSessionAsync = jest.mocked(openAuthSessionAsync);

const loginUrl =
  "https://card.example.com/login?request=opaque%2Bvalue&redirect_uri=ledgerlive%3A%2F%2Fpaytab";
const redirectUri = "https://ledger.com";

describe("openHostedLoginInSecureBrowser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the exact hosted login URL in the secure auth browser", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: redirectUri });

    await openHostedLoginInSecureBrowser(loginUrl, redirectUri);

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledWith(loginUrl, redirectUri);
  });

  it("should report a redirect back to the app", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: redirectUri });

    await expect(openHostedLoginInSecureBrowser(loginUrl, redirectUri)).resolves.toBe("redirected");
  });

  it.each(["cancel", "dismiss", "locked"] as const)(
    "should report a cancellation when the session ends with %s",
    async type => {
      mockedOpenAuthSessionAsync.mockResolvedValue({
        type,
      } as Awaited<ReturnType<typeof openAuthSessionAsync>>);

      await expect(openHostedLoginInSecureBrowser(loginUrl, redirectUri)).resolves.toBe(
        "cancelled",
      );
    },
  );
});
