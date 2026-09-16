import { clearLegacyPassword, readLegacyPassword } from "./legacyPassword.native";

jest.mock("react-native-keychain", () => ({
  ACCESS_CONTROL: { APPLICATION_PASSWORD: "applicationPassword" },
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const keychain = jest.requireMock("react-native-keychain");

beforeEach(() => jest.clearAllMocks());

describe("the legacy password entry", () => {
  it("reads back the password the old scheme stored in plaintext", async () => {
    keychain.getGenericPassword.mockResolvedValue({
      service: "",
      username: "user",
      password: "longenough",
    });

    await expect(readLegacyPassword("ios")).resolves.toBe("longenough");
  });

  it("is null when the old scheme stored nothing", async () => {
    keychain.getGenericPassword.mockResolvedValue(false);

    await expect(readLegacyPassword("ios")).resolves.toBeNull();
  });

  // Absent rather than fatal: the migration then leaves the entry alone and the user keeps getting
  // in through it, instead of meeting a screen that cannot help them.
  it("reads an unreadable entry as absent rather than throwing", async () => {
    keychain.getGenericPassword.mockRejectedValue(new Error("keychain unavailable"));

    await expect(readLegacyPassword("android")).resolves.toBeNull();
  });

  it("asks Android for the application password the old entry was guarded with", async () => {
    keychain.getGenericPassword.mockResolvedValue(false);

    await readLegacyPassword("android");

    expect(keychain.getGenericPassword).toHaveBeenCalledWith({
      accessControl: "applicationPassword",
    });
  });

  it("asks iOS for nothing, which is how the old entry was written there", async () => {
    keychain.getGenericPassword.mockResolvedValue(false);

    await readLegacyPassword("ios");

    expect(keychain.getGenericPassword).toHaveBeenCalledWith({});
  });

  it("destroys the entry, the last step of the migration", async () => {
    keychain.resetGenericPassword.mockResolvedValue(true);

    await clearLegacyPassword();

    expect(keychain.resetGenericPassword).toHaveBeenCalledWith();
  });
});
