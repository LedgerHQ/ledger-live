import { DeviceAppVerifyNotSupported, StatusCodes, UserRefusedAddress } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { Result, GetAddressOptions } from "../derivation";

export type GetAddressFn = (deviceId: string, addressOpt: GetAddressOptions) => Promise<Result>;

const getAddressWrapper =
  (getAddressFn: GetAddressFn) =>
  async (deviceId: string, opts: GetAddressOptions): Promise<Result> => {
    const { currency, path, verify } = opts;
    return getAddressFn(deviceId, opts)
      .then(result => {
        log("hw", `getAddress ${currency.id} on ${path}`, result);
        return result;
      })
      .catch(e => {
        log("hw", `getAddress ${currency.id} on ${path} FAILED ${String(e)}`);

        if (e && e.name === "TransportStatusError") {
          if (e.statusCode === StatusCodes.INCORRECT_P1_P2 && verify) {
            throw new DeviceAppVerifyNotSupported();
          }

          if (
            e.statusCode === StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED ||
            e.statusCode === StatusCodes.USER_REFUSED_ON_DEVICE
          ) {
            throw new UserRefusedAddress();
          }
        }

        throw e;
      });
  };

export default getAddressWrapper;
