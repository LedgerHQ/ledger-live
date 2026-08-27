import Transport from "@ledgerhq/hw-transport";
import Casper, { type ResponseAddress } from "@zondax/ledger-casper";
import { CreateSigner } from "../../bridge/setup";
import { getPath, isError } from "./common";
import { CasperGetAddrResponse, CasperSigner } from "./types";

const throwOnDeviceError = async <T extends { returnCode: number; errorMessage?: string }>(
  request: Promise<T>,
): Promise<T> => {
  const r = await request;
  isError(r);
  return r;
};

// @zondax/ledger-casper types `Address` as the boxed `String`; narrow it to a primitive.
const toAddrResponse = ({ Address, ...rest }: ResponseAddress): CasperGetAddrResponse => ({
  ...rest,
  Address: String(Address),
});

// Casper has no DMK signer nor hw-app-casper; device access goes through @zondax/ledger-casper.
export const createDeviceSigner: CreateSigner<CasperSigner> = (transport: Transport) => {
  const casper = new Casper(transport);
  return {
    showAddressAndPubKey: path =>
      throwOnDeviceError(casper.showAddressAndPubKey(getPath(path))).then(toAddrResponse),
    getAddressAndPubKey: path =>
      throwOnDeviceError(casper.getAddressAndPubKey(getPath(path))).then(toAddrResponse),
    sign: (path, message) => throwOnDeviceError(casper.sign(getPath(path), message)),
  };
};
