import * as SecureStore from "expo-secure-store";
import { secureStore } from "./secureStore.native";

jest.mock("expo-secure-store", () => ({
  AFTER_FIRST_UNLOCK: "after-first-unlock",
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("secureStore.native", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("writes with the AFTER_FIRST_UNLOCK accessibility level", async () => {
    await secureStore.write("payCard.session.accessToken", "at_token");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "payCard.session.accessToken",
      "at_token",
      { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK },
    );
  });

  it("reads the stored value", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("at_token");

    await expect(secureStore.read("payCard.session.accessToken")).resolves.toBe("at_token");
  });

  it("reads an unreadable value as absent", async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockRejectedValue(new Error("Could not decrypt the value"));

    await expect(secureStore.read("payCard.session.accessToken")).resolves.toBeNull();
  });

  it("removes the stored value", async () => {
    await secureStore.remove("payCard.session.accessToken");

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("payCard.session.accessToken");
  });
});
