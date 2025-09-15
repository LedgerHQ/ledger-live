import { map } from "rxjs/operators";
import { accountFormatters } from "@ledgerhq/live-common/account/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";

export type SyncJobOpts = ScanCommonOpts & {
  format: string;
};

export default {
  description: "Synchronize accounts with blockchain",
  args: [
    ...scanCommonOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(accountFormatters).join(" | "),
      desc: "how to display the data",
    },
  ],
  job: (opts: SyncJobOpts) =>
    scan(opts).pipe(
      map(account => (accountFormatters[opts.format] || accountFormatters.default)(account)),
    ),
};
