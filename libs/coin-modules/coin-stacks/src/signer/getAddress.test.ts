import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { AddressVersion } from "@stacks/transactions";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { ResponseAddress } from "@zondax/ledger-stacks";
import type { StacksSigner } from "../types";
import resolver from "./getAddress";

const DEVICE_ID = "device-id";
const PATH = "44'/5757'/0'/0/0";
const ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const PUBLIC_KEY = Buffer.from(
  "02a460decc9dba8c452927fecb33d7ae25a8d79dc5442b84feaf8f3aa0e2b575d",
  "hex",
);

const ADDRESS_OPTIONS = {
  path: PATH,
  verify: false,
  currency: getCryptoCurrencyById("stacks"),
  derivationMode: "stacks_wallet",
} as const;

function addressResponse(overrides: Partial<ResponseAddress> = {}): ResponseAddress {
  return {
    returnCode: 0x9000,
    errorMessage: "",
    address: ADDRESS,
    publicKey: PUBLIC_KEY,
    ...overrides,
  } as ResponseAddress;
}

describe("getAddress resolver", () => {
  const getAddressAndPubKey = jest.fn();
  const showAddressAndPubKey = jest.fn();
  const signer = { getAddressAndPubKey, showAddressAndPubKey } as unknown as StacksSigner;
  const signerContext = jest.fn((_deviceId, callback) =>
    callback(signer),
  ) as SignerContext<StacksSigner>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get an address without verifying it on the device", async () => {
    getAddressAndPubKey.mockResolvedValue(addressResponse());

    const address = await resolver(signerContext)(DEVICE_ID, ADDRESS_OPTIONS);

    expect(getAddressAndPubKey).toHaveBeenCalledWith(`m/${PATH}`, AddressVersion.MainnetSingleSig);
    expect(showAddressAndPubKey).not.toHaveBeenCalled();
    expect(address).toEqual({
      path: PATH,
      address: ADDRESS,
      publicKey: PUBLIC_KEY.toString("hex"),
    });
  });

  it("should show the address on the device when verification is requested", async () => {
    showAddressAndPubKey.mockResolvedValue(addressResponse());

    await resolver(signerContext)(DEVICE_ID, {
      ...ADDRESS_OPTIONS,
      path: `m/${PATH}`,
      verify: true,
    });

    expect(showAddressAndPubKey).toHaveBeenCalledWith(`m/${PATH}`, AddressVersion.MainnetSingleSig);
    expect(getAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("should throw the device error returned by the app", async () => {
    getAddressAndPubKey.mockResolvedValue(addressResponse({ returnCode: 0x6986 }));

    await expect(resolver(signerContext)(DEVICE_ID, ADDRESS_OPTIONS)).rejects.toBeInstanceOf(
      UserRefusedOnDevice,
    );
  });
});
