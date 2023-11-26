import { getEnv } from "@ledgerhq/live-env";

// @ts-expect-error sanity check on getEnv() not accepting incorrect key names
getEnv("yolo");

test("typecheck env", () => {
  expect(true).toBe(true);
});
