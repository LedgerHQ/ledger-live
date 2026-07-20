import { getEnv } from "@ledgerhq/live-env";

getEnv("yolo"); // type-lossy: any string key is accepted

test("typecheck env", () => {
  expect(true).toBe(true);
});
