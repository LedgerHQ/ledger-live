// @flow
/* eslint-disable global-require */

import { from, of, concat } from "rxjs";
import { map } from "rxjs/operators";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

export default {
  args: [],
  job: () =>
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
      from(withLibcore(core => core.LedgerCore.getStringVersion())).pipe(
        map(v => "libcore: " + v)
      )
    )
};
