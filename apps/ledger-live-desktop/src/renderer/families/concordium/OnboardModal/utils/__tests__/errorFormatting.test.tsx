import React from "react";
import { render } from "@testing-library/react";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { formatOnboardingError } from "../errorFormatting";

// Mock react-i18next to render the i18nKey as text
jest.mock("react-i18next", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Mock axios for isAxiosError check
jest.mock("axios", () => ({
  isAxiosError: jest.fn((error: unknown) => {
    return (
      typeof error === "object" &&
      error !== null &&
      "isAxiosError" in error &&
      error.isAxiosError === true
    );
  }),
}));

describe("formatOnboardingError", () => {
  describe("device errors", () => {
    it("should format UserRefusedOnDevice error", () => {
      const error = new UserRefusedOnDevice();
      const result = formatOnboardingError(error, "onboard");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).toContain("UserRefusedOnDevice");
    });

    it("should format LockedDeviceError error", () => {
      const error = new LockedDeviceError();
      const result = formatOnboardingError(error, "onboard");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).toContain("Locked device");
    });

    it("should handle device errors in both contexts", () => {
      const error = new UserRefusedOnDevice();

      const onboardResult = formatOnboardingError(error, "onboard");
      const createResult = formatOnboardingError(error, "create");

      expect(onboardResult).toEqual(createResult);
    });
  });

  describe("rate limit errors (429)", () => {
    it("should format 429 error in create context", () => {
      const error = {
        name: "AxiosError",
        isAxiosError: true,
        status: 429,
        message: "Too many requests",
      };

      const result = formatOnboardingError(error as unknown as Error, "create");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).toContain("error429");
    });

    it("should not use 429 format in onboard context", () => {
      const error = {
        name: "AxiosError",
        isAxiosError: true,
        status: 429,
        message: "Too many requests",
      };

      const result = formatOnboardingError(error as unknown as Error, "onboard");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).not.toContain("error429");
      expect(container.textContent).toContain("identity.error");
    });
  });

  describe("default error messages", () => {
    it("should return default onboard error for unknown error", () => {
      const error = new Error("Something went wrong");
      const result = formatOnboardingError(error, "onboard");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).toContain("identity.error");
    });

    it("should return default create error for unknown error", () => {
      const error = new Error("Something went wrong");
      const result = formatOnboardingError(error, "create");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).toContain("create.error");
    });

    it("should handle null error", () => {
      const result = formatOnboardingError(null, "onboard");

      const { container } = render(<div>{result}</div>);
      expect(container.textContent).toContain("identity.error");
    });
  });

  describe("context-specific behavior", () => {
    it("should use different default messages for different contexts", () => {
      const error = new Error("Generic error");

      const onboardResult = formatOnboardingError(error, "onboard");
      const createResult = formatOnboardingError(error, "create");

      const onboardRendered = render(<div>{onboardResult}</div>);
      const createRendered = render(<div>{createResult}</div>);

      expect(onboardRendered.container.textContent).toContain("identity.error");
      expect(createRendered.container.textContent).toContain("create.error");
      expect(onboardRendered.container.textContent).not.toEqual(
        createRendered.container.textContent,
      );
    });
  });
});
