import Casper from "@zondax/ledger-casper";
import Transport from "@ledgerhq/hw-transport";
import { getSigner } from "../../bridge/generic-coin-framework/signer";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import casperSigner, { createSigner } from "./signer";

jest.mock("@zondax/ledger-casper");

const MockedCasper = Casper as jest.MockedClass<typeof Casper>;
const mockTransport = {} as Transport;

// "02" is the secp256k1 tag, the rest is the 33-byte key the device returns.
const SECP256K1_ADDRESS = "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";

const okAddress = {
  errorMessage: "No errors",
  returnCode: 0x9000,
  publicKey: Buffer.from(SECP256K1_ADDRESS.slice(2), "hex"),
  Address: SECP256K1_ADDRESS.toUpperCase(),
};

describe("createSigner (Casper)", () => {
  let showAddressAndPubKey: jest.Mock;
  let getAddressAndPubKey: jest.Mock;
  let sign: jest.Mock;

  beforeEach(() => {
    showAddressAndPubKey = jest.fn().mockResolvedValue(okAddress);
    getAddressAndPubKey = jest.fn().mockResolvedValue(okAddress);
    sign = jest.fn();
    MockedCasper.mockImplementation(
      () => ({ showAddressAndPubKey, getAddressAndPubKey, sign }) as unknown as Casper,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddress", () => {
    it("reads silently and normalizes the path with an m/ prefix when absent", async () => {
      const signer = createSigner(mockTransport);

      const result = await signer.getAddress("44'/506'/0'/0/0");

      expect(getAddressAndPubKey).toHaveBeenCalledTimes(1);
      expect(getAddressAndPubKey).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
      expect(showAddressAndPubKey).not.toHaveBeenCalled();
      expect(result).toEqual({
        path: "44'/506'/0'/0/0",
        address: SECP256K1_ADDRESS,
        publicKey: SECP256K1_ADDRESS,
      });
    });

    it("keeps an already-prefixed path untouched", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("m/44'/506'/0'/0/0");

      expect(getAddressAndPubKey).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
    });

    it("confirms on device when verify is requested", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/506'/0'/0/0", { verify: true });

      expect(showAddressAndPubKey).toHaveBeenCalledTimes(1);
      expect(showAddressAndPubKey).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
      expect(getAddressAndPubKey).not.toHaveBeenCalled();
    });

    it("throws on a non-0x9000 return code instead of returning a bad address", async () => {
      getAddressAndPubKey.mockResolvedValue({
        ...okAddress,
        returnCode: 0x6a80,
        errorMessage: "nope",
      });
      const signer = createSigner(mockTransport);

      await expect(signer.getAddress("44'/506'/0'/0/0")).rejects.toThrow("27264 - nope");
    });
  });
});

describe("casper signer registration", () => {
  it("registers a loadSigner on the casper coin-module loader", () => {
    const loader = coinModuleLoaders.find(l => l.family === "casper");

    expect(loader?.loadSigner).toBeDefined();
  });

  it("resolves through getSigner so the generic coin framework can reach it", async () => {
    await expect(getSigner("casper")).resolves.toBe(casperSigner);
  });
});
