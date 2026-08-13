import resolver from "./getShieldedAddress";
import type { SignerContext } from "../types/signer";

const PATH = "m/32'/133'/0'";

const signer = {
  getShieldedAddress: jest.fn(async () => ({
    address: "u1testunifiedaddress",
  })),
};

const signerContext = ((_deviceId: string, fn: (s: typeof signer) => unknown) =>
  fn(signer)) as unknown as SignerContext;

beforeEach(() => jest.clearAllMocks());

describe("getShieldedAddress resolver", () => {
  it("asks the device for the shielded address at the path and reports it back", async () => {
    const getShieldedAddress = resolver(signerContext);

    expect(await getShieldedAddress("deviceId", { path: PATH })).toEqual({
      address: "u1testunifiedaddress",
    });
    expect(signer.getShieldedAddress).toHaveBeenCalledWith(PATH, undefined);
  });

  it("passes display=true through to the signer", async () => {
    await resolver(signerContext)("deviceId", { path: PATH, display: true });

    expect(signer.getShieldedAddress).toHaveBeenCalledWith(PATH, true);
  });

  it("passes display=false through to the signer", async () => {
    await resolver(signerContext)("deviceId", { path: PATH, display: false });

    expect(signer.getShieldedAddress).toHaveBeenCalledWith(PATH, false);
  });
});
