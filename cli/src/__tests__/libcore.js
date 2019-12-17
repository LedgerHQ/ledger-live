// @flow


import {
  withLibcore,
  afterLibcoreGC
} from "@ledgerhq/live-common/lib/libcore/access";
import { setup } from "../live-common-setup-test";

setup("libcore");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe("libcore access", () => {
  test("withLibcore", async () => {
    const res = await withLibcore(async core => {
      expect(core).toBeDefined();
      await sleep(100);
      return 42;
    });
    expect(res).toBe(42);
  });

  test("afterLibcoreGC", async () => {
    let count = 0;
    let gcjob = 0;

    withLibcore(async () => {
      await sleep(100);
      ++count;
    });

    withLibcore(async () => {
      await sleep(100);
      ++count;
    });

    let p3;

    await sleep(20).then(() =>
      afterLibcoreGC(async () => {
        expect(count).toBe(2);
        await sleep(100);
        p3 = withLibcore(async () => {
          await sleep(400);
          ++count;
        });
        expect(count).toBe(2);
        await sleep(100);
        expect(count).toBe(2);
        gcjob++;
      })
    );

    await p3;

    expect(count).toBe(3);
    expect(gcjob).toBe(1);
  });
});
