import { deriveOnDevice } from "./discoveryPorts";

const mockSigner = { getWalletXpub: jest.fn(async () => "xpubFromDevice") };
const mockGetAddress = jest.fn(async (..._args: unknown[]) => ({
  address: "0xabc",
  path: "",
  publicKey: "",
}));

jest.mock("../families/bitcoin/setup", () => ({
  signerContext: (_: string, __: unknown, fn: (signer: typeof mockSigner) => Promise<string>) =>
    fn(mockSigner),
}));
jest.mock("../hw/getAddress", () => ({
  __esModule: true,
  default: (transport: unknown, opts: unknown) => mockGetAddress(transport, opts),
}));
jest.mock("../hw/deviceAccess", () => ({
  withDevice: () => (job: (transport: unknown) => import("rxjs").Observable<unknown>) => job({}),
}));

describe("deriveOnDevice", () => {
  it("asks the signer for the xpub of a bitcoin account, at the account path", async () => {
    const key = await deriveOnDevice("dev")({
      currencyId: "bitcoin",
      derivationMode: "native_segwit",
      index: 0,
      path: "84'/0'/0'/0/0",
      accountPath: "84'/0'/0'",
    });
    expect(key).toEqual({ type: "utxo", xpub: "xpubFromDevice" });
    expect(mockSigner.getWalletXpub).toHaveBeenCalledWith(
      expect.objectContaining({ path: "84'/0'/0'" }),
    );
  });

  it("asks the family resolver for the address of any other account, at the full path", async () => {
    const key = await deriveOnDevice("dev")({
      currencyId: "ethereum",
      derivationMode: "",
      index: 2,
      path: "44'/60'/2'/0/0",
      accountPath: "44'/60'/2'",
    });
    expect(key).toEqual({ type: "address", address: "0xabc" });
    expect(mockGetAddress).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ path: "44'/60'/2'/0/0", derivationMode: "" }),
    );
  });
});
