import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AddressVersion } from "@stacks/transactions/dist";
import type { StacksSigner } from "../types";
import getAddress from "./getAddress";

const PATH = "44'/5757'/0'/0/0";
const ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const OPTIONS = { path: PATH, verify: false } as never;

const makeSigner = (response: Record<string, unknown>) => ({
  getAddressAndPubKey: jest.fn().mockResolvedValue(response),
  showAddressAndPubKey: jest.fn().mockResolvedValue(response),
});

const contextFor = (signer: ReturnType<typeof makeSigner>) =>
  ((_deviceId: string, fn: (signer: unknown) => unknown) =>
    fn(signer)) as unknown as SignerContext<StacksSigner>;

describe("stacks getAddress resolver", () => {
  it("returns the address, the path and the hex public key from the device", async () => {
    const signer = makeSigner({
      returnCode: 0x9000,
      address: ADDRESS,
      publicKey: Buffer.from("02ab", "hex"),
    });

    const result = await getAddress(contextFor(signer))("device", OPTIONS);

    expect(result).toEqual({ path: PATH, address: ADDRESS, publicKey: "02ab" });
    expect(signer.getAddressAndPubKey).toHaveBeenCalledWith(
      `m/${PATH}`,
      AddressVersion.MainnetSingleSig,
    );
    expect(signer.showAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("shows the address on the device when verify is true", async () => {
    const signer = makeSigner({
      returnCode: 0x9000,
      address: ADDRESS,
      publicKey: Buffer.from("02ab", "hex"),
    });

    await getAddress(contextFor(signer))("device", { path: PATH, verify: true } as never);

    expect(signer.showAddressAndPubKey).toHaveBeenCalledTimes(1);
    expect(signer.getAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("throws UserRefusedOnDevice when the device refuses", async () => {
    const signer = makeSigner({
      returnCode: 0x6986,
      errorMessage: "",
      address: "",
      publicKey: Buffer.alloc(0),
    });

    await expect(getAddress(contextFor(signer))("device", OPTIONS)).rejects.toThrow(
      UserRefusedOnDevice,
    );
  });
});
