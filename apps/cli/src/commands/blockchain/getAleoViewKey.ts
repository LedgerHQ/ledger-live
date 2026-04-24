import { from } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { viewKeyResolver } from "@ledgerhq/live-common/families/aleo/setup";
import {
  CurrencyCommonOpts,
  currencyOpt,
  DeviceCommonOpts,
  deviceOpt,
  inferCurrency,
} from "../../scan";

export type GetViewKeyJobOpts = CurrencyCommonOpts &
  DeviceCommonOpts &
  Partial<{
    path?: string;
  }>;

// FIXME: Aleo specific code in place that feels generic
export default {
  description: "Get the Aleo view key for a derivation path (requires device confirmation)",
  args: [
    currencyOpt,
    deviceOpt,
    {
      name: "path",
      type: String,
      desc: "HD derivation path",
    },
  ],
  job: (arg: GetViewKeyJobOpts) =>
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
            viewKeyResolver(t, {
              path: arg.path as string,
              currency,
            }),
          ).pipe(map(result => JSON.stringify(result))),
        );
      }),
    ),
};
