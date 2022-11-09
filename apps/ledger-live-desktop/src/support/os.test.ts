import { supportStatusForOS } from "./os";

test("a regular Mac version passes", () => {
  expect(supportStatusForOS("Darwin", "18.7.0")).toMatchObject({ supported: true }); // macos 10.14.7
  expect(supportStatusForOS("Darwin", "21.2.0")).toMatchObject({ supported: true });
});

test("a regular Linux version passes", () => {
  expect(supportStatusForOS("Linux", "5.19.1-3-MANJARO")).toMatchObject({ supported: true });
});

test("a regular Windows version passes", () => {
  expect(supportStatusForOS("Windows_NT", "10.0.22000")).toMatchObject({ supported: true });
});

test("an old Mac version passes", () => {
  expect(supportStatusForOS("Darwin", "17.7.0")).toMatchObject({ supported: false }); // macos 10.13.6
});

test("an old Windows version passes", () => {
  expect(supportStatusForOS("Windows_NT", "6.1.7601")).toMatchObject({ supported: false });
});
