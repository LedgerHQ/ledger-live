jest.mock("./internals/trackEvent", () => ({
  trackEvent: jest.fn(),
}));

import { setEnabledFn } from "./registry";
import { trackEvent } from "./internals/trackEvent";
import { track } from "./track";

const register = () => {
  setEnabledFn(() => true);
};

beforeEach(() => {
  jest.mocked(trackEvent).mockReset();
  setEnabledFn(() => true);
});

describe("track", () => {
  it("delegates to trackEvent when tracking is enabled", () => {
    register();

    track("Analytics Event", { event: "props" });

    expect(trackEvent).toHaveBeenCalledWith(
      "track",
      "Analytics Event",
      { event: "props" },
      { mandatory: false },
    );
  });

  it("does not delegate when tracking is disabled", () => {
    register();
    setEnabledFn(() => false);

    track("Analytics Consent", { flow: "onboarding" });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("delegates mandatory events even when tracking is disabled", () => {
    register();
    setEnabledFn(() => false);

    track("Analytics Consent", { flow: "onboarding" }, { mandatory: true });

    expect(trackEvent).toHaveBeenCalledWith(
      "track",
      "Analytics Consent",
      { flow: "onboarding" },
      { mandatory: true },
    );
  });
});
