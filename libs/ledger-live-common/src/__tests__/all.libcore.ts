/*
import { from } from "rxjs";
import { mergeAll } from "rxjs/operators";
import { flatMap } from "lodash";
*/
import { log } from "@ledgerhq/logs";
import { setup } from "./test-helpers/libcore-setup";
import { withLibcore, afterLibcoreGC } from "../libcore/access";
import { delay } from "../promise";
import { testBridge } from "./test-helpers/bridge";
import dataset from "../generated/test-dataset";
import specifics from "../generated/test-specifics";
import type { DatasetTest } from "../types";
import { disconnectAll } from "../api";
// Disconnect all api clients that could be open.
afterAll(async () => {
  await disconnectAll();
});
setup("libcore");
test("libcore version", async () => {
  const v = await withLibcore((core) => core.LedgerCore.getStringVersion());
  expect(typeof v).toBe("string");
  log("libcoreVersion", v as string);
});
const families = Object.keys(dataset);
const maybeFamilyToOnlyRun =
  process.env.BRANCH && process.env.BRANCH.split("/")[0];
const shouldExcludeFamilies =
  maybeFamilyToOnlyRun && families.includes(maybeFamilyToOnlyRun);
// covers all bridges through many different accounts
// to test the common shared properties of bridges.
// const all =
families
  .map((family) => {
    if (process.env.FAMILY && process.env.FAMILY !== family) return;
    if (shouldExcludeFamilies && maybeFamilyToOnlyRun !== family) return;
    const data: DatasetTest<any> = dataset[family];
    return testBridge(family, data);
  })
  .filter(Boolean);
// FIXME overkill atm but could help perf

/*
const MAX_CONCURRENT = 2;
from(flatMap(all, r => r.preloadObservables))
  .pipe(mergeAll(MAX_CONCURRENT))
  .subscribe();
*/
Object.values(specifics).forEach((specific: (...args: Array<any>) => any) => {
  specific();
});
describe("libcore access", () => {
  test("withLibcore", async () => {
    const res = await withLibcore(async (core) => {
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
