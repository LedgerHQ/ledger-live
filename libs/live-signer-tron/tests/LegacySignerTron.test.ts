import Trx from "@ledgerhq/hw-app-trx";
import Transport from "@ledgerhq/hw-transport";
import { LegacySignerTron } from "../src/LegacySignerTron";

jest.mock("@ledgerhq/hw-app-trx");

const MockedTrx = Trx as jest.MockedClass<typeof Trx>;

const PATH = "44'/195'/0'/0/0";

describe("LegacySignerTron", () => {
  const transport = {} as Transport;
  let getAddress: jest.Mock;
  let signTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getAddress = jest.fn().mockResolvedValue({
      publicKey: "0424e5f6",
      address: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL",
    });
    signTransaction = jest.fn().mockResolvedValue("3045deadbeef");
    MockedTrx.mockImplementation(() => ({ getAddress, signTransaction }) as unknown as Trx);
  });

  it("delegates getAddress to hw-app-trx and returns its answer unchanged", async () => {
    const signer = new LegacySignerTron(transport);

    const result = await signer.getAddress(PATH, true);

    expect(getAddress).toHaveBeenCalledWith(PATH, true);
    expect(result).toEqual({
      publicKey: "0424e5f6",
      address: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL",
    });
  });

  it("leaves the display flag undefined when the caller passes none", async () => {
    const signer = new LegacySignerTron(transport);

    await signer.getAddress(PATH);

    expect(getAddress).toHaveBeenCalledWith(PATH, undefined);
  });

  it("forwards the token signatures to hw-app-trx and returns its hex signature", async () => {
    const signer = new LegacySignerTron(transport);

    const result = await signer.sign(PATH, "0a02f594", ["cafe"]);

    expect(signTransaction).toHaveBeenCalledWith(PATH, "0a02f594", ["cafe"]);
    expect(result).toBe("3045deadbeef");
  });

  it("forwards an empty token signature array untouched", async () => {
    const signer = new LegacySignerTron(transport);

    await signer.sign(PATH, "0a02f594", []);

    expect(signTransaction).toHaveBeenCalledWith(PATH, "0a02f594", []);
  });

  it("builds one hw-app-trx client per signer, on the transport it is given", () => {
    new LegacySignerTron(transport);

    expect(MockedTrx).toHaveBeenCalledTimes(1);
    expect(MockedTrx).toHaveBeenCalledWith(transport);
  });
});
