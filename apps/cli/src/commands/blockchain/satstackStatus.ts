import { first } from "rxjs/operators";
import { statusObservable } from "@ledgerhq/live-common/families/bitcoin/satstack";
import { setEnv } from "@ledgerhq/live-env";

export type SatstackStatusJobOpts = { continuous?: boolean };

export default {
  description: "Check StackSats status",
  args: [
    {
      name: "continuous",
      type: Boolean,
      desc: "enable status polling",
    },
  ],
  job: ({ continuous }: SatstackStatusJobOpts) => {
    setEnv("SATSTACK", true);

    if (!continuous) {
      return statusObservable.pipe(first());
    }

    return statusObservable;
  },
};
