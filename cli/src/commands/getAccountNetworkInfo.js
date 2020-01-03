// @flow

import { from } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { getAccountNetworkInfo } from "@ledgerhq/live-common/lib/libcore/getAccountNetworkInfo";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";

const getAccountNetworkInfoFormatters = {
  json: e => JSON.stringify(e)
};

export default {
  description: "Get the currency network info for accounts",
  args: [
    ...scanCommonOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(getAccountNetworkInfoFormatters).join(" | "),
      desc: "how to display the data"
    }
  ],
  job: (opts: ScanCommonOpts & { format: string }) =>
    scan(opts).pipe(
      mergeMap(account => from(getAccountNetworkInfo(account))),
      map(e => {
        const f = getAccountNetworkInfoFormatters[opts.format || "json"];
        if (!f) {
          throw new Error(
            "getAccountNetworkInfo: no such formatter '" + opts.format + "'"
          );
        }
        return f(e);
      })
    )
};
