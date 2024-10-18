import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { asDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import {
  CurrencyCommonOpts,
  currencyOpt,
  DeviceCommonOpts,
  deviceOpt,
  inferCurrency,
} from "../../scan";

export type GetAddressJobOpts = CurrencyCommonOpts &
  DeviceCommonOpts &
  Partial<{
    path?: string;
    derivationMode?: string;
    verify?: boolean;
  }>;

export default {
  description: "Get an address with the device on specific derivations (advanced)",
  args: [
    currencyOpt,
    deviceOpt,
    {
      name: "path",
      type: String,
      desc: "HDD derivation path",
    },
    {
      name: "derivationMode",
      type: String,
      desc: "derivationMode to use",
    },
    {
      name: "verify",
      alias: "v",
      type: Boolean,
      desc: "also ask verification on device",
    },
  ],
  job: (arg: GetAddressJobOpts) =>
    inferCurrency(arg).pipe(
      mergeMap(currency => {
        if (!currency) {
          throw new Error("no currency provided");
        }

        if (!arg.path) {
          throw new Error("--path is required");
        }

        return withDevice(arg.device || "")(t =>
          from(
            getAddress(t, {
              currency,
              path: arg.path as string,
              derivationMode: asDerivationMode(arg.derivationMode || ""),
              verify: arg.verify,
            }),
          ),
        );
      }),
    ),
};
