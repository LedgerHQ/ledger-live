import { A4Client } from "./index";
import { A4HttpError } from "./errors";
import { clearA4RegistrationCache, ensureA4Registered } from "./registration";
import { computeA4AccountVersion } from "./accountVersion";

jest.mock("./index");
jest.mock("@ledgerhq/logs");

describe("ensureA4Registered", () => {
  let client: A4Client;

  beforeEach(() => {
    client = new A4Client("https://a4.example.com", "ethereum");
    jest.mocked(client.getAccount).mockReset();
    jest.mocked(client.createAccount).mockReset();
    jest.mocked(client.addAddresses).mockReset();
    clearA4RegistrationCache();
  });

  it("registers on cache miss, then skips A4 calls on subsequent sync with same addresses", async () => {
    jest.mocked(client.getAccount).mockResolvedValue({
      data: {
        id: "acc-1",
        createdAt: "2024-01-01T00:00:00Z",
        version: "v1",
        status: "Synchronized",
      },
      version: "v1",
    });

    await ensureA4Registered(client, "acc-1", ["0xabc"]);
    await ensureA4Registered(client, "acc-1", ["0xabc"]);

    expect(client.getAccount).toHaveBeenCalledTimes(1);
    expect(client.createAccount).not.toHaveBeenCalled();
    expect(client.addAddresses).not.toHaveBeenCalled();
  });

  it("treats a changed address set as a cache miss and re-registers", async () => {
    jest.mocked(client.getAccount).mockResolvedValue({
      data: {
        id: "acc-1",
        createdAt: "2024-01-01T00:00:00Z",
        version: "v1",
        status: "Synchronized",
      },
      version: "v1",
    });

    await ensureA4Registered(client, "acc-1", ["0xabc"]);
    await ensureA4Registered(client, "acc-1", ["0xabc", "0xdef"]);

    expect(client.getAccount).toHaveBeenCalledTimes(2);
  });

  describe("404 - account unknown to A4", () => {
    it("creates account, adds addresses, then caches so next sync skips", async () => {
      jest.mocked(client.getAccount).mockRejectedValueOnce(new A4HttpError("not found", 404));
      jest
        .mocked(client.createAccount)
        .mockResolvedValueOnce({ data: "acc-1", version: undefined });
      jest.mocked(client.addAddresses).mockResolvedValueOnce({ data: "acc-1", version: "v1" });

      await ensureA4Registered(client, "acc-1", ["0xabc"]);

      expect(client.createAccount).toHaveBeenCalledWith("acc-1");
      expect(client.addAddresses).toHaveBeenCalledWith("acc-1", ["0xabc"]);

      await ensureA4Registered(client, "acc-1", ["0xabc"]);
      expect(client.getAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe("412 - DC version mismatch", () => {
    it("re-adds addresses on 412 and caches when server version matches expected", async () => {
      const version = computeA4AccountVersion(["0xabc"]);

      jest
        .mocked(client.getAccount)
        .mockRejectedValueOnce(new A4HttpError("version mismatch", 412));
      jest.mocked(client.addAddresses).mockResolvedValueOnce({ data: "acc-1", version });

      await ensureA4Registered(client, "acc-1", ["0xabc"]);

      expect(client.addAddresses).toHaveBeenCalledWith("acc-1", ["0xabc"]);
      expect(client.getAccount).toHaveBeenCalledTimes(1);

      await ensureA4Registered(client, "acc-1", ["0xabc"]);
      expect(client.getAccount).toHaveBeenCalledTimes(1);
    });

    it("does not cache when addAddresses returns a mismatched version, so next sync retries", async () => {
      jest
        .mocked(client.getAccount)
        .mockRejectedValueOnce(new A4HttpError("version mismatch", 412))
        .mockRejectedValueOnce(new A4HttpError("version mismatch", 412));
      jest.mocked(client.addAddresses).mockResolvedValue({ data: "acc-1", version: "sv" });

      await ensureA4Registered(client, "acc-1", ["0xabc"]);
      await ensureA4Registered(client, "acc-1", ["0xabc"]);

      expect(client.getAccount).toHaveBeenCalledTimes(2);
    });
  });

  it("swallows transport errors", async () => {
    jest.mocked(client.getAccount).mockRejectedValueOnce(new A4HttpError("network error"));

    await expect(ensureA4Registered(client, "acc-1", ["0xabc"])).resolves.toBeUndefined();
  });

  it("swallows unexpected status errors", async () => {
    jest.mocked(client.getAccount).mockRejectedValueOnce(new A4HttpError("server error", 500));

    await expect(ensureA4Registered(client, "acc-1", ["0xabc"])).resolves.toBeUndefined();
  });
});
