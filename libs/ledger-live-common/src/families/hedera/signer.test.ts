import { createSignerHedera, hederaGetAddress, type HederaFamilySigner } from "./signer";
import Hedera from "@ledgerhq/hw-app-hedera";
import Transport from "@ledgerhq/hw-transport";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";

jest.mock("@ledgerhq/hw-app-hedera");

const MockedHedera = Hedera as jest.MockedClass<typeof Hedera>;
const mockTransport = {} as Transport;

describe("createSignerHedera", () => {
  let mockGetPublicKey: jest.Mock;
  let mockSignTransaction: jest.Mock;

  beforeEach(() => {
    mockGetPublicKey = jest.fn().mockResolvedValue("deadbeef");
    mockSignTransaction = jest.fn().mockResolvedValue(Buffer.from("cafe", "hex"));
    MockedHedera.mockImplementation(
      () =>
        ({
          getPublicKey: mockGetPublicKey,
          signTransaction: mockSignTransaction,
        }) as unknown as Hedera,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards the path to hw-app-hedera's getPublicKey", async () => {
    const signer = createSignerHedera(mockTransport);

    const publicKey = await signer.getPublicKey("44'/3030'/0'/0/0");

    expect(mockGetPublicKey).toHaveBeenCalledWith("44'/3030'/0'/0/0");
    expect(publicKey).toBe("deadbeef");
  });

  it("drops the path and options, signs the hex-decoded transaction, and base64-encodes the signature", async () => {
    const signer = createSignerHedera(mockTransport);

    const signature = await signer.signTransaction("44'/3030'/0'/0/0", "beef", {
      derivationMode: "",
    });

    expect(mockSignTransaction).toHaveBeenCalledWith(Buffer.from("beef", "hex"));
    expect(signature).toBe(Buffer.from("cafe", "hex").toString("base64"));
  });
});

describe("hederaGetAddress", () => {
  it("uses the public key as both address and publicKey", async () => {
    const signer: HederaFamilySigner = {
      getPublicKey: jest.fn().mockResolvedValue("deadbeef"),
      signTransaction: jest.fn(),
    };
    const signerContext: SignerContext<HederaFamilySigner> = (_deviceId, fn) => fn(signer);
    const options: GetAddressOptions = {
      currency: getCryptoCurrencyById("hedera"),
      path: "44'/3030'/0'/0/0",
      derivationMode: "",
    };

    const getAddress = hederaGetAddress(signerContext);
    const result = await getAddress("deviceId", options);

    expect(result).toEqual({
      path: "44'/3030'/0'/0/0",
      address: "deadbeef",
      publicKey: "deadbeef",
    });
  });
});
