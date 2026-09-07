import { getEnv } from "@shared/env";

// @ts-expect-error – "yolo" is not a valid env key
if (false as boolean) getEnv("yolo");

test("typecheck env", () => {
  expect(true).toBe(true);
});
