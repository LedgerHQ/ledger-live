import { getEnv } from "@shared/env";

// @ts-expect-error – @ledgerhq/live-env is typed in PR1; becomes type-lossy in PR2
getEnv("yolo");

test("typecheck env", () => {
  expect(true).toBe(true);
});
