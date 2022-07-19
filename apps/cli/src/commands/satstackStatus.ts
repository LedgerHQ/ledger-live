import { first } from "rxjs/operators";
import { statusObservable } from "@ledgerhq/live-common/families/bitcoin/satstack";
import { setEnv } from "@ledgerhq/live-common/env";
export default {
  description: "Check StackSats status",
  args: [
    {
      name: "continuous",
      type: Boolean,
      desc: "enable status polling",
    },
  ],
  job: ({ continuous }: { continuous?: boolean }) => {
    setEnv("SATSTACK", true);

    if (!continuous) {
      return statusObservable.pipe(first());
    }

    return statusObservable;
  },
};
