import { openAuthSessionAsync } from "expo-web-browser";
import { openHostedLoginInSecureBrowser } from "../openHostedLogin.native";

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

const mockedOpenAuthSessionAsync = jest.mocked(openAuthSessionAsync);

describe("openHostedLoginInSecureBrowser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the exact hosted login URL in the secure auth browser", async () => {
    const loginUrl =
      "https://card.example.com/login?request=opaque%2Bvalue&redirect_uri=ledgerlive%3A%2F%2Fpaytab";

    await openHostedLoginInSecureBrowser(loginUrl);

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledWith(loginUrl);
  });
});
