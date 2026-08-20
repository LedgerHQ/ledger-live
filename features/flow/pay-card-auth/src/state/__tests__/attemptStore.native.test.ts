import {
  STORAGE_TYPE,
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
} from "react-native-keychain";
import { clearAttempt, loadAttempt, saveAttempt } from "../attemptStore.native";

jest.mock("react-native-keychain", () => ({
  ACCESSIBLE: { AFTER_FIRST_UNLOCK: "AccessibleAfterFirstUnlock" },
  STORAGE_TYPE: { AES_GCM_NO_AUTH: "KeystoreAESGCM_NoAuth" },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const attempt = { state: "state-value", codeVerifier: "verifier-value" };

/** What a write answers: `Result`, which names the key and the storage. Never the secret back. */
const writeResult = {
  service: "payCard.pkce.attempt",
  storage: STORAGE_TYPE.AES_GCM_NO_AUTH,
};

/** What a read answers: `UserCredentials`, which is a `Result` plus the pair. */
const storedEntry = {
  ...writeResult,
  username: "payCard",
  password: JSON.stringify(attempt),
};

describe("attemptStore (native)", () => {
  beforeEach(() => {
    jest.mocked(setGenericPassword).mockResolvedValue(writeResult);
    jest.mocked(resetGenericPassword).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("keeps both halves of the attempt under one key", async () => {
    await saveAttempt(attempt);

    expect(setGenericPassword).toHaveBeenCalledWith("payCard", JSON.stringify(attempt), {
      service: "payCard.pkce.attempt",
      accessible: "AccessibleAfterFirstUnlock",
      storage: "KeystoreAESGCM_NoAuth",
    });
  });

  it("rejects when the keychain refuses the write", async () => {
    jest.mocked(setGenericPassword).mockResolvedValue(false);

    await expect(saveAttempt(attempt)).rejects.toThrow(
      "The keychain refused to store payCard.pkce.attempt",
    );
  });

  it("reads back the attempt it stored", async () => {
    jest.mocked(getGenericPassword).mockResolvedValue(storedEntry);

    await expect(loadAttempt()).resolves.toEqual(attempt);
  });

  it("reads nothing when no attempt is stored", async () => {
    jest.mocked(getGenericPassword).mockResolvedValue(false);

    await expect(loadAttempt()).resolves.toBeNull();
  });

  it.each(["not json at all", "{}", '{"state":"state-value"}', '{"codeVerifier":"v"}'])(
    "reads no attempt when the payload is %s",
    async payload => {
      jest.mocked(getGenericPassword).mockResolvedValue({ ...storedEntry, password: payload });

      await expect(loadAttempt()).resolves.toBeNull();
    },
  );

  it("reads no attempt when the store cannot answer", async () => {
    jest.mocked(getGenericPassword).mockRejectedValue(new Error("cannot decrypt"));

    await expect(loadAttempt()).resolves.toBeNull();
  });

  it("forgets the attempt", async () => {
    await clearAttempt();

    expect(resetGenericPassword).toHaveBeenCalledWith({ service: "payCard.pkce.attempt" });
  });
});
