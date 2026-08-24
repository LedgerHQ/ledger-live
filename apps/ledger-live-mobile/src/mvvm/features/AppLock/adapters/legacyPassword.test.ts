jest.mock("react-native-keychain", () => ({
  ACCESS_CONTROL: { APPLICATION_PASSWORD: "applicationPassword" },
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import { clearLegacyPassword, readLegacyPassword } from "./legacyPassword";

const keychain = jest.requireMock("react-native-keychain");

beforeEach(() => jest.clearAllMocks());

describe("the legacy plaintext entry", () => {
  it("reads the password the old lock stored", async () => {
    keychain.getGenericPassword.mockResolvedValue({ password: "short" });

    await expect(readLegacyPassword()).resolves.toBe("short");
  });

  it("answers nothing when there is no entry", async () => {
    keychain.getGenericPassword.mockResolvedValue(false);

    await expect(readLegacyPassword()).resolves.toBeNull();
  });

  it("answers nothing rather than throwing when the keychain refuses", async () => {
    keychain.getGenericPassword.mockRejectedValue(new Error("keychain unavailable"));

    await expect(readLegacyPassword()).resolves.toBeNull();
  });

  it("clears the default service, which is where the old lock wrote", async () => {
    keychain.resetGenericPassword.mockResolvedValue(true);

    await clearLegacyPassword();

    expect(keychain.resetGenericPassword).toHaveBeenCalledWith();
  });
});
