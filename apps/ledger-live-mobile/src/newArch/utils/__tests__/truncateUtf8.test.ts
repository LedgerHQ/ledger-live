import { truncateUtf8 } from "../truncateUtf8";

test("truncateUtf8", () => {
  expect(truncateUtf8("hello world", 0)).toBe("");
  expect(truncateUtf8("hello world", 50)).toBe("hello world");
  expect(truncateUtf8("hello world", 1)).toBe("h");
  expect(truncateUtf8("hello world", 5)).toBe("hello");
  expect(truncateUtf8("👋💬🌎", 4)).toBe("👋");
  expect(truncateUtf8("👋💬🌎", 3)).toBe("");
  expect(truncateUtf8("👋💬🌎", 12)).toBe("👋💬🌎");
  expect(truncateUtf8("👋💬🌎", 11)).toBe("👋💬");
});
