import type { ConcordiumCoinConfig } from "../../types";
import { getAccountStatus } from "./getAccountStatus";

jest.mock("../../network/proxyClient", () => ({ getAccountsByPublicKey: jest.fn() }));
const { getAccountsByPublicKey } = jest.requireMock("../../network/proxyClient");

const config = {} as ConcordiumCoinConfig;

describe("getAccountStatus", () => {
  it("is onboarded and used once the public key has an account on chain", async () => {
    getAccountsByPublicKey.mockResolvedValue([{ address: "3abc" }]);
    await expect(getAccountStatus(config, "concordium", "ab")).resolves.toEqual({
      used: true,
      isOnboarded: true,
    });
    expect(getAccountsByPublicKey).toHaveBeenCalledWith(config, "concordium", "ab");
  });

  it("is neither without an account on chain", async () => {
    getAccountsByPublicKey.mockResolvedValue([]);
    await expect(getAccountStatus(config, "concordium", "ab")).resolves.toEqual({
      used: false,
      isOnboarded: false,
    });
  });

  it("fails when the lookup fails, rather than calling the key unused", async () => {
    getAccountsByPublicKey.mockRejectedValue(new Error("down"));
    await expect(getAccountStatus(config, "concordium", "ab")).rejects.toThrow("down");
  });
});
