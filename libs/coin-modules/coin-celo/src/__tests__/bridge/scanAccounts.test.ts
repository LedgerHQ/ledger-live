import { UpdateYourApp } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { lastValueFrom, toArray } from "rxjs";
import type { CeloSigner } from "../../signer/signer";

jest.mock("../../bridge/synchronisation", () => ({ getAccountShape: jest.fn(), sync: jest.fn() }));
import { getAccountShape } from "../../bridge/synchronisation";
import { buildCurrencyBridge } from "../../bridge";

const E0 = "0x000000000000000000000000000000000000000e"; // celoEvm index 0 (the "used" account)
const ADDR_BY_PATH: Record<string, string> = {
  "44'/52752'/0'": "0x0000000000000000000000000000000000000001", // seed identifier
  "44'/52752'/0'/0/0": "0x0000000000000000000000000000000000000002", // celo (legacy) idx 0
  "44'/60'/0'/0/0": "0x0000000000000000000000000000000000000003", // celoMM idx 0
  "44'/60'/0'/0'/0'": E0, // celoEvm idx 0
};

// Fake signer mimics LegacySignerCelo, which translates an unauthorized path's
// 0x6a15 into UpdateYourApp.
const makeSigner = (opts: { idx1Error: unknown }) =>
  ({
    getAddress: (path: string) => {
      if (path === "44'/60'/1'/0'/0'") return Promise.reject(opts.idx1Error);
      const address = ADDR_BY_PATH[path] ?? "0x0000000000000000000000000000000000000009";
      return Promise.resolve({ address, publicKey: "04" + address.slice(2) });
    },
  }) as unknown as CeloSigner;

const scanOf = (signer: CeloSigner) => {
  const signerContext = (_id: string, fn: (s: CeloSigner) => Promise<unknown>) => fn(signer);
  const { scanAccounts } = buildCurrencyBridge(signerContext as never);
  return lastValueFrom(
    scanAccounts({
      currency: getCryptoCurrencyById("celo"),
      deviceId: "deviceId",
      syncConfig: { paginationConfig: {} },
    } as never).pipe(toArray()),
  );
};

describe("celo scanAccounts resilience (LIVE-34433)", () => {
  beforeEach(() => {
    (getAccountShape as jest.Mock).mockImplementation(({ address }: { address: string }) =>
      Promise.resolve({
        id: `js:2:celo:${address}:`,
        used: address.toLowerCase() === E0.toLowerCase(),
      }),
    );
  });

  it("completes with the authorized accounts when the signer reports UpdateYourApp for celoEvm index >=1", async () => {
    const events = await scanOf(
      makeSigner({
        idx1Error: new UpdateYourApp(undefined, { managerAppName: "Celo" }),
      }),
    );
    // scan completed (did not error) and the authorized celoEvm index-0 account was discovered
    expect(events.some(e => e.account.freshAddress.toLowerCase() === E0.toLowerCase())).toBe(true);
  });

  it("still aborts the scan on any other device error (skip is targeted)", async () => {
    await expect(
      scanOf(
        makeSigner({
          idx1Error: { name: "TransportStatusError", statusCode: 0x6a80 },
        }),
      ),
    ).rejects.toEqual({ name: "TransportStatusError", statusCode: 0x6a80 });
  });
});
