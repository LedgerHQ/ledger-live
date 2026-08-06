import { featureFlagsLense } from "./DBSave";
import { payCardPersistedSelector } from "@domain/entity-pay-card";
import type { State } from "~/reducers/types";

describe("featureFlagsLense", () => {
  it("projects only { overrides, bannerVisible } — never the transient remoteFlagsReady gate", () => {
    const overrides = { mockFeature: { enabled: true } };
    const state = {
      featureFlags: {
        overrides,
        bannerVisible: false,
        remoteFlagsReady: true,
      },
    } as unknown as State;

    const projected = featureFlagsLense(state);

    expect(projected).toEqual({ overrides, bannerVisible: false });
    expect(projected).not.toHaveProperty("remoteFlagsReady");
  });
});

describe("payCardPersistedSelector (mobile persistence lens)", () => {
  it("projects only { hasSeenFeatureTour } — never the transient isOpen/params", () => {
    const state = {
      payCard: {
        isOpen: true,
        params: { platform: "cl-card", name: "CL Card" },
        hasSeenFeatureTour: true,
      },
    } as unknown as State;

    const projected = payCardPersistedSelector(state);

    expect(projected).toEqual({ hasSeenFeatureTour: true });
    expect(projected).not.toHaveProperty("isOpen");
    expect(projected).not.toHaveProperty("params");
  });

  it("does not change when only transient fields change", () => {
    const base = {
      payCard: { isOpen: false, params: null, hasSeenFeatureTour: false },
    } as unknown as State;
    const opened = {
      payCard: {
        isOpen: true,
        params: { platform: "cl-card", name: "CL Card" },
        hasSeenFeatureTour: false,
      },
    } as unknown as State;

    expect(payCardPersistedSelector(base)).toEqual(payCardPersistedSelector(opened));
  });
});
