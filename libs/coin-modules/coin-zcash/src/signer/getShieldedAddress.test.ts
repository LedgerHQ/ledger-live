import resolver from "./getShieldedAddress";
import type { SignerContext } from "../types/signer";

const PATH = "44'/133'/0'/0/0";

const signer = {
  getShieldedAddress: jest.fn(async () => ({
    address: "u1testunifiedaddress",
  })),
};

const signerContext = ((_deviceId: string, fn: (s: typeof signer) => unknown) =>
  fn(signer)) as unknown as SignerContext;

beforeEach(() => jest.clearAllMocks());

describe("getShieldedAddress resolver", () => {
  it("asks the device for the shielded/unified address at the path and reports it back", async () => {
    const getShieldedAddress = resolver(signerContext);

    expect(await getShieldedAddress("deviceId", { path: PATH })).toEqual({
      address: "u1testunifiedaddress",
    });
    expect(signer.getShieldedAddress).toHaveBeenCalledWith(PATH, undefined);
  });

  it("passes the on-device display flag through", async () => {
    await resolver(signerContext)("deviceId", { path: PATH, display: true });

    expect(signer.getShieldedAddress).toHaveBeenCalledWith(PATH, true);
  });

  it("narrows the result to just the address, dropping anything else the signer returns", async () => {
    signer.getShieldedAddress.mockResolvedValueOnce({
      address: "u1testunifiedaddress",
      extraneous: "should-not-leak",
    } as never);

    expect(await resolver(signerContext)("deviceId", { path: PATH })).toEqual({
      address: "u1testunifiedaddress",
    });
  });
});
