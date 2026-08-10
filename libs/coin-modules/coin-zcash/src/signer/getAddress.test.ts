import resolver from "./getAddress";
import type { SignerContext } from "../types/signer";

const PATH = "44'/133'/0'/0/0";

const signer = {
  getAddress: jest.fn(async () => ({
    address: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
    publicKey: "02aa",
    chainCode: "cc".repeat(32),
  })),
};

const signerContext = ((_deviceId: string, fn: (s: typeof signer) => unknown) =>
  fn(signer)) as unknown as SignerContext;

beforeEach(() => jest.clearAllMocks());

describe("getAddress resolver", () => {
  it("asks the device for the address at the path and reports it back", async () => {
    const getAddress = resolver(signerContext);

    expect(await getAddress("deviceId", { path: PATH } as never)).toEqual({
      address: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
      path: PATH,
      publicKey: "02aa",
      chainCode: "cc".repeat(32),
    });
    expect(signer.getAddress).toHaveBeenCalledWith(PATH, false);
  });

  it("passes the on-device verification through", async () => {
    await resolver(signerContext)("deviceId", { path: PATH, verify: true } as never);

    expect(signer.getAddress).toHaveBeenCalledWith(PATH, true);
  });

  it("leaves the chain code out when the device does not return one", async () => {
    signer.getAddress.mockResolvedValueOnce({
      address: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
      publicKey: "02aa",
    } as never);

    expect(await resolver(signerContext)("deviceId", { path: PATH } as never)).not.toHaveProperty(
      "chainCode",
    );
  });
});
