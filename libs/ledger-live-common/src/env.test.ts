import { getEnv } from "@ledgerhq/live-env";

// @ledgerhq/live-env is type-lossy by design; typed access is via @shared/live-env
getEnv("yolo");

test("typecheck env", () => {
  expect(true).toBe(true);
});
