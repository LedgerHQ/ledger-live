import { from } from "rxjs";
import { getEnv } from "@ledgerhq/live-common/env";
import { listAppCandidates } from "@ledgerhq/live-common/load/speculos";
import { formatAppCandidate } from "@ledgerhq/live-common/bot/formatters";
import invariant from "invariant";
import { mergeAll } from "rxjs/operators";

export default {
  description: "list apps available for speculos",
  args: [],
  job: () => {
    async function main() {
      const coinapps = getEnv("COINAPPS");
      invariant(coinapps, "COINAPPS is not set");
      const candidates = await listAppCandidates(coinapps);
      return candidates.map(formatAppCandidate);
    }
    return from(main()).pipe(mergeAll());
  },
};
