// @flow

import { map } from "rxjs/operators";
import accountFormatters from "../accountFormatters";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";

export default {
  description: "Synchronize accounts with blockchain",
  args: [
    ...scanCommonOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(accountFormatters).join(" | "),
      desc: "how to display the data"
    }
  ],
  job: (opts: ScanCommonOpts & { format: string }) =>
    scan(opts).pipe(
      map(account =>
        (accountFormatters[opts.format] || accountFormatters.default)(account)
      )
    )
};
