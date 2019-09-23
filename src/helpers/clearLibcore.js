// @flow

import { afterLibcoreGC } from "@ledgerhq/live-common/lib/libcore/access";
import { delay } from "@ledgerhq/live-common/lib/promise";

export default (job?: () => Promise<any>) =>
  afterLibcoreGC(async libcore => {
    await delay(1000);
    if (job) {
      await job();
    }
    await libcore.getPoolInstance().freshResetAll();
    await delay(2000);
  });
