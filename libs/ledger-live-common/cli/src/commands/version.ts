/* eslint-disable global-require, @typescript-eslint/no-var-requires */
import { from, of, concat, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

export default {
  args: [],
  job: (): Observable<string> =>
    concat(
      of("ledger-live cli: " + require("../../package.json").version),
      of(
        "@ledgerhq/live-common: " +
          require("@ledgerhq/live-common/package.json").version
      ),
      of(
        "@ledgerhq/ledger-core: " +
          require("@ledgerhq/ledger-core/package.json").version
      ),
      from(withLibcore((core) => core.LedgerCore.getStringVersion())).pipe(
        map((v) => "libcore: " + v)
      )
    ),
};
