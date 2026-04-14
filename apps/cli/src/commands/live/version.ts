/* oxlint-disable typescript/no-require-imports */
import { of, concat, Observable } from "rxjs";

export default {
  args: [],
  job: (): Observable<string> =>
    concat(
      of("ledger-live cli: " + require("../../../package.json").version),
      of("@ledgerhq/live-common: " + require("@ledgerhq/live-common/package.json").version),
    ),
};
