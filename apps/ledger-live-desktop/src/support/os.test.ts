import { describe, test, expect } from "@jest/globals";
import { setEnv } from "@ledgerhq/live-env";
import { getOperatingSystemSupportStatus, supportStatusForOS } from "./os";

describe("supportStatusForOS", () => {
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
});

describe("getOperatingSystemSupportStatus", () => {
  test("default behavior of running on CI is passing", () => {
    expect(getOperatingSystemSupportStatus()).toMatchObject({ supported: true });
  });
  test("the env is mockable", () => {
    setEnv("MOCK_OS_VERSION", "Windows_NT@6.1.7601");
    try {
      expect(getOperatingSystemSupportStatus()).toMatchObject({ supported: false });
    } finally {
      setEnv("MOCK_OS_VERSION", "");
    }
  });
});
