import Casper from "@zondax/ledger-casper";
import Transport from "@ledgerhq/hw-transport";
import { createDeviceSigner } from "./deviceSigner";

jest.mock("@zondax/ledger-casper");

const MockedCasper = Casper as jest.MockedClass<typeof Casper>;
const mockTransport = {} as Transport;

// "02" is the secp256k1 tag, the rest is the 33-byte key the device returns.
const SECP256K1_ADDRESS = "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";

const okAddress = {
  errorMessage: "No errors",
  returnCode: 0x9000,
  publicKey: Buffer.from(SECP256K1_ADDRESS.slice(2), "hex"),
  Address: SECP256K1_ADDRESS,
};

const okSign = {
  errorMessage: "No errors",
  returnCode: 0x9000,
  signatureRS: Buffer.alloc(64, 0xab),
  signatureRSV: Buffer.alloc(65, 0xab),
};

describe("createDeviceSigner (Casper)", () => {
  let showAddressAndPubKey: jest.Mock;
  let getAddressAndPubKey: jest.Mock;
  let sign: jest.Mock;

  beforeEach(() => {
    showAddressAndPubKey = jest.fn().mockResolvedValue(okAddress);
    getAddressAndPubKey = jest.fn().mockResolvedValue(okAddress);
    sign = jest.fn().mockResolvedValue(okSign);
    MockedCasper.mockImplementation(
      () => ({ showAddressAndPubKey, getAddressAndPubKey, sign }) as unknown as Casper,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["getAddressAndPubKey", () => getAddressAndPubKey],
    ["showAddressAndPubKey", () => showAddressAndPubKey],
  ] as const)("prefixes the path with m/ when absent for %s", async (method, mock) => {
    const signer = createDeviceSigner(mockTransport);

    await signer[method]("44'/506'/0'/0/0");

    expect(mock()).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
  });

  it("prefixes the path with m/ when absent for sign", async () => {
    const signer = createDeviceSigner(mockTransport);
    const message = Buffer.from("deadbeef", "hex");

    await signer.sign("44'/506'/0'/0/0", message);

    expect(sign).toHaveBeenCalledWith("m/44'/506'/0'/0/0", message);
  });

  it("keeps an already-prefixed path untouched", async () => {
    const signer = createDeviceSigner(mockTransport);

    await signer.getAddressAndPubKey("m/44'/506'/0'/0/0");

    expect(getAddressAndPubKey).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
  });

  it("returns Address as a primitive string even when the device app hands back a wrapper", async () => {
    getAddressAndPubKey.mockResolvedValue({ ...okAddress, Address: new String(SECP256K1_ADDRESS) });
    const signer = createDeviceSigner(mockTransport);

    const r = await signer.getAddressAndPubKey("m/44'/506'/0'/0/0");

    expect(typeof r.Address).toBe("string");
    expect(r.Address).toBe(SECP256K1_ADDRESS);
  });

  describe("throws on a non-0x9000 return code instead of returning a bad result", () => {
    it("for getAddressAndPubKey", async () => {
      getAddressAndPubKey.mockResolvedValue({
        ...okAddress,
        returnCode: 0x6a80,
        errorMessage: "nope",
      });
      const signer = createDeviceSigner(mockTransport);

      await expect(signer.getAddressAndPubKey("44'/506'/0'/0/0")).rejects.toThrow("27264 - nope");
    });

    it("for showAddressAndPubKey", async () => {
      showAddressAndPubKey.mockResolvedValue({
        ...okAddress,
        returnCode: 0x6985,
        errorMessage: "rejected",
      });
      const signer = createDeviceSigner(mockTransport);

      await expect(signer.showAddressAndPubKey("44'/506'/0'/0/0")).rejects.toThrow(
        "27013 - rejected",
      );
    });

    it("for sign", async () => {
      sign.mockResolvedValue({ ...okSign, returnCode: 0x6985, errorMessage: "rejected" });
      const signer = createDeviceSigner(mockTransport);

      await expect(signer.sign("44'/506'/0'/0/0", Buffer.alloc(4))).rejects.toThrow(
        "27013 - rejected",
      );
    });
  });
});
