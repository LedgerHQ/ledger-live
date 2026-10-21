import invariant from "invariant";
import { DeviceAppVerifyNotSupported, UserRefusedAddress } from "../../errors";
import { log } from "@ledgerhq/logs";
import { Resolver } from "./types";
import { loadSetupForFamily } from "../../coin-modules/registry";
import { resolveFamily } from "../../bridge/zcashRouting";

const dispatch: Resolver = async (transport, opts) => {
  const { currency, verify } = opts;
  // The module that serves the currency, as for its bridge: coin-zcash for Zcash, whose
  // currency family is "bitcoin".
  const setup = await loadSetupForFamily(resolveFamily(currency));
  const getAddress = setup.resolver;
  invariant(getAddress, `getAddress is not implemented for ${currency.id}`);
  return getAddress(transport, opts)
    .then(result => {
      log("hw", `getAddress ${currency.id} on ${opts.path}`, result);
      return result;
    })
    .catch(e => {
      log("hw", `getAddress ${currency.id} on ${opts.path} FAILED ${String(e)}`);

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

export default dispatch;
