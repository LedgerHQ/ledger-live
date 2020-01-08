// @flow
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

export default {
  args: [],
  job: () =>
    withLibcore(async core => {
      await core.getPoolInstance().freshResetAll();
    })
};
