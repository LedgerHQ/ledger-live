// @flow
import invariant from "invariant";
import {
  DeviceAppVerifyNotSupported,
  UserRefusedAddress,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { Resolver } from "./types";
import perFamily from "../../generated/hw-signMessage";

const dispatch: Resolver = (transport, opts) => {
  const { currency, verify } = opts;
  const getAddress = perFamily[currency.family];
  invariant(getAddress, `signMessage is not implemented for ${currency.id}`);
  return getAddress(transport, opts)
    .then((result) => {
      log(
        "hw",
        `signMessage ${currency.id} on ${opts.path} with message [${opts.message}]`,
        result
      );
      return result;
    })
    .catch((e) => {
      log(
        "hw",
        `signMessage ${currency.id} on ${opts.path} FAILED ${String(e)}`
      );
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

export default dispatch;
