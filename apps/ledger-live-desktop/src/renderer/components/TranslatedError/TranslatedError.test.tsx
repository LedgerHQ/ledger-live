import React from "react";
import type { DmkError } from "@ledgerhq/live-dmk-desktop";
import { render } from "tests/testSetup";
import logger from "~/renderer/logger";
import { TranslatedError } from "./TranslatedError";

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: { critical: jest.fn(), onReduxAction: jest.fn() },
}));

const mockedCritical = jest.mocked(logger.critical);

describe("TranslatedError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not report a DMK error", () => {
    const dmkError: DmkError = {
      _tag: "DeviceBusyError",
      message: "Device is busy",
      originalError: undefined,
    };
    render(<TranslatedError error={dmkError} />);
    expect(mockedCritical).not.toHaveBeenCalled();
  });

  it.each([null, undefined])("does not report a missing error (%s)", error => {
    render(<TranslatedError error={error} />);
    expect(mockedCritical).not.toHaveBeenCalled();
  });

  it("does not report a regular Error", () => {
    render(<TranslatedError error={new Error("boom")} />);
    expect(mockedCritical).not.toHaveBeenCalled();
  });

  it("reports an invalid value with its type", () => {
    // @ts-expect-error invalid usage on purpose
    render(<TranslatedError error={{ foo: "bar" }} />);
    expect(mockedCritical).toHaveBeenCalledTimes(1);
    expect(mockedCritical).toHaveBeenCalledWith("TranslatedError invalid usage: object");
  });
});
