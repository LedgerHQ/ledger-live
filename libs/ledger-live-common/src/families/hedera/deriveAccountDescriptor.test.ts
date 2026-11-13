import { lastValueFrom, type Observable } from "rxjs";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { hederaConfig } from "./config";
import { deriveAccountDescriptor } from "./setup";

const getPublicKey = jest.fn();
jest.mock("@ledgerhq/hw-app-hedera", () => jest.fn().mockImplementation(() => ({ getPublicKey })));
const getAccountsForPublicKey = jest.fn();
jest.mock("@ledgerhq/coin-hedera/network/api", () => ({
  apiClient: { getAccountsForPublicKey: (...args: unknown[]) => getAccountsForPublicKey(...args) },
}));

LiveConfig.setConfig(hederaConfig);
const hedera = getCryptoCurrencyById("hedera");
const PUBLIC_KEY = "302a300506032b6570032100aa";
const newScan =
  () =>
  <T>(job: (transport: never) => Observable<T>) =>
    job({} as never);
const deriveAt = (runOnTransport: ReturnType<typeof newScan>, index: number) =>
  lastValueFrom(
    deriveAccountDescriptor(runOnTransport, hedera, candidateOf(hedera, "hederaBip44", index)),
  );

beforeEach(() => {
  jest.clearAllMocks();
  getPublicKey.mockResolvedValue(PUBLIC_KEY);
  getAccountsForPublicKey.mockResolvedValue([{ account: "0.0.11" }, { account: "0.0.22" }]);
});

describe("hedera deriveAccountDescriptor", () => {
  it("is the index-th account the mirror node lists for the key, at the legacy path", async () => {
    const scan = newScan();
    await expect(deriveAt(scan, 0)).resolves.toEqual({
      descriptor: expect.objectContaining({ type: "address", key: "0.0.11", path: "m/44/3030" }),
      keyHasMoreAccounts: true,
    });
    await expect(deriveAt(scan, 1)).resolves.toEqual({
      descriptor: expect.objectContaining({ key: "0.0.22", path: "m/44/3030" }),
      keyHasMoreAccounts: false,
    });
    expect(getPublicKey).toHaveBeenCalledWith("44/3030");
    expect(getAccountsForPublicKey).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: PUBLIC_KEY }),
    );
  });

  it("reads the key and looks its accounts up once per scan", async () => {
    const scan = newScan();
    for (const index of [0, 1, 2]) await deriveAt(scan, index);
    expect(getPublicKey).toHaveBeenCalledTimes(1);
    expect(getAccountsForPublicKey).toHaveBeenCalledTimes(1);
    await deriveAt(newScan(), 0);
    expect(getPublicKey).toHaveBeenCalledTimes(2);
  });

  it("ends the mode past the accounts of the key, and at once for a key with none", async () => {
    await expect(deriveAt(newScan(), 2)).resolves.toBeNull();
    getAccountsForPublicKey.mockResolvedValue([]);
    await expect(deriveAt(newScan(), 0)).resolves.toBeNull();
  });

  it("reads the key again after a failed lookup", async () => {
    const scan = newScan();
    getAccountsForPublicKey.mockRejectedValueOnce(new Error("mirror down"));
    await expect(deriveAt(scan, 0)).rejects.toThrow("mirror down");
    await expect(deriveAt(scan, 0)).resolves.toMatchObject({ descriptor: { key: "0.0.11" } });
  });
});
