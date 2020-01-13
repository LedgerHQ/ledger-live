// @flow

import { setup } from "./test-helpers/libcore-setup";
import { withLibcore, afterLibcoreGC } from "../libcore/access";
import { delay } from "../promise";
import { testBridge } from "./test-helpers/bridge";
import dataset from "../generated/test-dataset";
import specifics from "../generated/test-specifics";
import type { DatasetTest } from "./test-helpers/bridge";

setup("libcore");

describe("libcore access", () => {
  test("withLibcore", async () => {
    const res = await withLibcore(async core => {
      expect(core).toBeDefined();
      await delay(100);
      return 42;
    });
    expect(res).toBe(42);
  });

  test("afterLibcoreGC", async () => {
    let count = 0;
    let gcjob = 0;

    withLibcore(async () => {
      await delay(100);
      ++count;
    });

    withLibcore(async () => {
      await delay(100);
      ++count;
    });

    let p3;

    await delay(20);

    await afterLibcoreGC(async () => {
      expect(count).toBe(2);
      await delay(100);
      p3 = withLibcore(async () => {
        await delay(400);
        ++count;
      });
      expect(count).toBe(2);
      await delay(100);
      expect(count).toBe(2);
      gcjob++;
    });

    await p3;

    expect(count).toBe(3);
    expect(gcjob).toBe(1);
  });
});

// covers all bridges through many different accounts
// to test the common shared properties of bridges.
Object.keys(dataset).forEach(family => {
  if (process.env.FAMILY && process.env.FAMILY !== family) return;
  const data: DatasetTest<any> = dataset[family];
  testBridge(family, data);
});

Object.values(specifics).forEach((specific: Function) => {
  specific();
});
