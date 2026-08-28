import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import { LegacySignerXrp } from "../src/LegacySignerXrp";

jest.mock("@ledgerhq/hw-app-xrp");

const MockedXrp = Xrp as jest.MockedClass<typeof Xrp>;

describe("LegacySignerXrp", () => {
  const transport = {} as Transport;
  let getAddress: jest.Mock;
  let signTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getAddress = jest.fn().mockResolvedValue({
      publicKey: "0324e5f6",
      address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    });
    signTransaction = jest.fn().mockResolvedValue("3045deadbeef");
    MockedXrp.mockImplementation(() => ({ getAddress, signTransaction }) as unknown as Xrp);
  });

  it("delegates getAddress to hw-app-xrp and returns its answer unchanged", async () => {
    const signer = new LegacySignerXrp(transport);

    const result = await signer.getAddress("44'/144'/0'/0/0", true, true, false);

    expect(getAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", true, true, false);
    expect(result).toEqual({
      publicKey: "0324e5f6",
      address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    });
  });

  it("delegates signTransaction to hw-app-xrp and returns its hex signature", async () => {
    const signer = new LegacySignerXrp(transport);

    const result = await signer.signTransaction("44'/144'/0'/0/0", "1200002280000000", true);

    expect(signTransaction).toHaveBeenCalledWith("44'/144'/0'/0/0", "1200002280000000", true);
    expect(result).toBe("3045deadbeef");
  });

  it("builds one hw-app-xrp client per signer, on the transport it is given", () => {
    new LegacySignerXrp(transport);

    expect(MockedXrp).toHaveBeenCalledTimes(1);
    expect(MockedXrp).toHaveBeenCalledWith(transport);
  });
});
