import Transport from "@ledgerhq/hw-transport";
import {
  DeviceAppVerifyNotSupported,
  UserRefusedAddress,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { Result, GetAddressOptions } from "../derivation";

export type Resolver = (
  transport: Transport,
  addressOpt: GetAddressOptions
) => Promise<Result>;

const getAddressWrapper =
  (getAddressFn: Resolver) =>
  (transport: Transport, opts: GetAddressOptions) => {
    const { currency, path, verify } = opts;
    return getAddressFn(transport, opts)
      .then((result) => {
        log("hw", `getAddress ${currency.id} on ${path}`, result);
        return result;
      })
      .catch((e) => {
        log("hw", `getAddress ${currency.id} on ${path} FAILED ${String(e)}`);

        if (e && e.name === "TransportStatusError") {
          if (e.statusCode === 0x6b00 && verify) {
            throw new DeviceAppVerifyNotSupported();
          }

          if (e.statusCode === 0x6985 || e.statusCode === 0x5501) {
            throw new UserRefusedAddress();
          }
        }

        throw e;
      });
  };

export default getAddressWrapper;
