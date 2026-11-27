import { getAccountStatus } from "./getAccountStatus";
import { createFixtureContext } from "../../test/fixtures";

jest.mock("../../network/proxyClient", () => ({ getAccountsByPublicKey: jest.fn() }));
const { getAccountsByPublicKey } = jest.requireMock("../../network/proxyClient");

const context = createFixtureContext();

describe("getAccountStatus", () => {
  it("is activated and used once the public key has an account on chain", async () => {
    getAccountsByPublicKey.mockResolvedValue([{ address: "3abc" }]);
    await expect(getAccountStatus(context, "ab")).resolves.toEqual({
      activated: true,
      used: true,
    });
    expect(getAccountsByPublicKey).toHaveBeenCalledWith(context, "ab", undefined);
  });

  it("is neither without an account on chain", async () => {
    getAccountsByPublicKey.mockResolvedValue([]);
    await expect(getAccountStatus(context, "ab")).resolves.toEqual({
      activated: false,
      used: false,
    });
  });

  it("fails when the lookup fails, rather than calling the key unused", async () => {
    getAccountsByPublicKey.mockRejectedValue(new Error("down"));
    await expect(getAccountStatus(context, "ab")).rejects.toThrow("down");
  });
});
