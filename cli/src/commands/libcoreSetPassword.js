// @flow

import { getEnv } from "@ledgerhq/live-common/lib/env";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

export default {
  args: [{ name: "password", type: String, desc: "the new password" }],
  job: ({ password }: $Shape<{ password: string }>) =>
    withLibcore(core =>
      core
        .getPoolInstance()
        .changePassword(getEnv("LIBCORE_PASSWORD"), password || "")
    )
};
