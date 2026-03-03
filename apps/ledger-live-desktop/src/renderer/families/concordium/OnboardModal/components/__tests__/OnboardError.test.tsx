import React from "react";
import { render } from "tests/testSetup";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import OnboardError from "../OnboardError";

describe("OnboardError", () => {
  describe("device errors", () => {
    it("should format UserRefusedOnDevice error", () => {
      const { container } = render(
        <OnboardError error={new UserRefusedOnDevice()} context="onboard" />,
      );
      expect(container.textContent).toContain("UserRefusedOnDevice");
    });

    it("should format LockedDeviceError error", () => {
      const { container } = render(
        <OnboardError error={new LockedDeviceError()} context="onboard" />,
      );
      expect(container.textContent).toContain("Locked device");
    });

    it("should show the same message regardless of context", () => {
      const { container: onboardContainer } = render(
        <OnboardError error={new UserRefusedOnDevice()} context="onboard" />,
      );
      const { container: createContainer } = render(
        <OnboardError error={new UserRefusedOnDevice()} context="create" />,
      );

      expect(onboardContainer.textContent).toEqual(createContainer.textContent);
    });
  });

  describe("rate limit errors (429)", () => {
    const axiosError = Object.assign(new Error("Too many requests"), {
      name: "AxiosError",
      isAxiosError: true,
      status: 429,
    });

    it("should format 429 error in create context", () => {
      const { container } = render(<OnboardError error={axiosError} context="create" />);
      expect(container.textContent).toContain("Too many requests");
    });

    it("should not use 429 format in onboard context", () => {
      const { container } = render(<OnboardError error={axiosError} context="onboard" />);
      expect(container.textContent).not.toContain("Too many requests");
      expect(container.textContent).toContain("Failed to onboard new account");
    });
  });

  describe("default error messages", () => {
    it("should show default onboard error for unknown error", () => {
      const { container } = render(
        <OnboardError error={new Error("Something went wrong")} context="onboard" />,
      );
      expect(container.textContent).toContain("Failed to onboard new account");
    });

    it("should show default create error for unknown error", () => {
      const { container } = render(
        <OnboardError error={new Error("Something went wrong")} context="create" />,
      );
      expect(container.textContent).toContain("Failed to create account");
    });

    it("should handle null error", () => {
      const { container } = render(<OnboardError error={null} context="onboard" />);
      expect(container.textContent).toContain("Failed to onboard new account");
    });
  });

  describe("context-specific behavior", () => {
    it("should use different default messages for different contexts", () => {
      const { container: onboardContainer } = render(
        <OnboardError error={new Error("Generic error")} context="onboard" />,
      );
      const { container: createContainer } = render(
        <OnboardError error={new Error("Generic error")} context="create" />,
      );

      expect(onboardContainer.textContent).toContain("Failed to onboard new account");
      expect(createContainer.textContent).toContain("Failed to create account");
      expect(onboardContainer.textContent).not.toEqual(createContainer.textContent);
    });
  });
});
