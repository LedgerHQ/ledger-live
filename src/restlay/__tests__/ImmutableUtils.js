//@flow
import { merge } from "../ImmutableUtils";
import isEqual from "lodash/isEqual";

test("merge do the merge work", () => {
  expect(merge({ foo: 42 }, null)).toMatchObject({ foo: 42 });
  expect(merge({ foo: 42 }, { bar: 45 })).toMatchObject({
    foo: 42,
    bar: 45
  });
  expect(merge({ foo: 42 }, { foo: "3", bar: 45 })).toMatchObject({
    foo: "3",
    bar: 45
  });
});

test("merge only returns a new object if it changes", () => {
  const a = { foo: 42, bar: 43 };
  expect(merge(a, null)).toBe(a);
  expect(merge(a, { foo: 42 })).toBe(a);
  expect(merge(a, { bar: 43 })).toBe(a);
  expect(merge(a, { foo: 42, bar: 43 })).toBe(a);
  expect(merge(a, { toto: 43 })).not.toBe(a);
  expect(merge(a, { foo: 43 })).not.toBe(a);
  expect(merge(a, { foo: 42, bar: 44 })).not.toBe(a);
});

test("merge works with different equality", () => {
  const a = { foo: { foo: 42 }, bar: 43 };
  expect(merge(a, null, isEqual)).toBe(a);
  expect(merge(a, { foo: { foo: 42 } }, isEqual)).toBe(a);
});
