import { captureExceptionWithExtraData } from "../captureExceptionWithExtraData";
import * as Sentry from "@sentry/react-native";

jest.mock("@sentry/react-native", () => ({
  ...jest.requireActual("@sentry/react-native"),
  withScope: jest.fn(),
  captureException: jest.fn(),
}));

describe("captureExceptionWithExtraData", () => {
  it("should call Sentry.withScope with the provided extra data", () => {
    const error = new Error("Test error");
    const extraData = { key: "value" };
    const withScopeMock = Sentry.withScope as jest.Mock;

    captureExceptionWithExtraData(error, extraData);

    expect(withScopeMock).toHaveBeenCalled();
  });

  it("should call scope.setExtra with the provided extra data", () => {
    const error = new Error("Test error");
    const extraData = { key: "value" };

    const setExtraMock = jest.fn();
    const withScopeMock = Sentry.withScope as jest.Mock;

    withScopeMock.mockImplementation(callback => {
      const mockScope = { setExtra: setExtraMock };
      callback(mockScope);
    });

    captureExceptionWithExtraData(error, extraData);

    expect(setExtraMock).toHaveBeenCalledWith("key", "value");
  });

  it("should call Sentry.captureException with the error", () => {
    const error = new Error("Test error");

    captureExceptionWithExtraData(error, undefined);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
