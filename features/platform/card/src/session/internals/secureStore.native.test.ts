import {
  STORAGE_TYPE,
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
} from "react-native-keychain";
import { secureStore } from "./secureStore.native";

jest.mock("react-native-keychain", () => ({
  ACCESSIBLE: { AFTER_FIRST_UNLOCK: "AccessibleAfterFirstUnlock" },
  STORAGE_TYPE: { AES_GCM_NO_AUTH: "KeystoreAESGCM_NoAuth" },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const KEY = "payCard.session.accessToken";

const storedEntry = {
  username: "payCard",
  password: "at_token",
  service: KEY,
  storage: STORAGE_TYPE.AES_GCM_NO_AUTH,
};

describe("secureStore.native", () => {
  beforeEach(() => {
    jest.mocked(setGenericPassword).mockResolvedValue(storedEntry);
    jest.mocked(resetGenericPassword).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("gives the key its own entry, readable after the first unlock and behind no prompt", async () => {
    await secureStore.write(KEY, "at_token");

    expect(setGenericPassword).toHaveBeenCalledWith("payCard", "at_token", {
      service: KEY,
      accessible: "AccessibleAfterFirstUnlock",
      storage: "KeystoreAESGCM_NoAuth",
    });
  });

  it("rejects when the keychain refuses the write", async () => {
    jest.mocked(setGenericPassword).mockResolvedValue(false);

    await expect(secureStore.write(KEY, "at_token")).rejects.toThrow(
      "The keychain refused to store payCard.session.accessToken",
    );
  });

  it("reads the stored value", async () => {
    jest.mocked(getGenericPassword).mockResolvedValue(storedEntry);

    await expect(secureStore.read(KEY)).resolves.toBe("at_token");
    expect(getGenericPassword).toHaveBeenCalledWith({ service: KEY });
  });

  it("reads an empty entry as absent", async () => {
    jest.mocked(getGenericPassword).mockResolvedValue(false);

    await expect(secureStore.read(KEY)).resolves.toBeNull();
  });

  it("rejects when the keychain refuses the read, rather than reading it as absent", async () => {
    jest.mocked(getGenericPassword).mockRejectedValue(new Error("Could not decrypt the value"));

    // An absent session ends one, and a locked keychain must never end a session.
    await expect(secureStore.read(KEY)).rejects.toThrow("Could not decrypt the value");
  });

  it("removes the entry of the key", async () => {
    await secureStore.remove(KEY);

    expect(resetGenericPassword).toHaveBeenCalledWith({ service: KEY });
  });

  it("does not reject when the keychain refuses to forget", async () => {
    jest.mocked(resetGenericPassword).mockResolvedValue(false);

    await expect(secureStore.remove(KEY)).resolves.toBeUndefined();
  });
});
