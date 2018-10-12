// @flow
import invariant from "invariant";
import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "../../types";
import { DeviceAppVerifyNotSupported, UserRefusedAddress } from "../../errors";

import bitcoin from "./btc";
import ethereum from "./ethereum";
import ripple from "./ripple";

export const perFamily: { [_: string]: Resolver } = {
  bitcoin,
  ethereum,
  ripple
};

export default (
  transport: Transport<*>,
  currency: CryptoCurrency,
  path: string,
  verify: boolean = false
): Promise<Result> => {
  const getAddress = perFamily[currency.family];
  invariant(getAddress, `getAddress is not implemented for ${currency.id}`);
  return getAddress(transport, currency, path, verify).catch(e => {
    if (e && e.name === "TransportStatusError") {
      if (e.statusCode === 0x6b00 && verify) {
        throw new DeviceAppVerifyNotSupported();
      }
      if (e.statusCode === 0x6985) {
        throw new UserRefusedAddress();
      }
    }
    throw e;
  });
};

type Result = {
  address: string,
  path: string,
  publicKey: string
};

type Resolver = (
  transport: Transport<*>,
  currency: CryptoCurrency,
  path: string,
  verify: boolean
) => Promise<Result>;
