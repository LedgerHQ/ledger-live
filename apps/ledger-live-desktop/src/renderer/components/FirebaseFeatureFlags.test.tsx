import React from "react";
import { Feature, FeatureId, Features } from "@ledgerhq/types-live";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { act, render, screen } from "tests/testSetup";
import { FirebaseFeatureFlagsProvider } from "./FirebaseFeatureFlags";

const mockRemoteConfig = { config: {}, lastFetchTime: 0 };
jest.mock("./FirebaseRemoteConfig", () => ({
  useFirebaseRemoteConfig: () => mockRemoteConfig,
}));

const makeGetFeature =
  (getValue: () => Feature) =>
  <T extends FeatureId>({ key: _key }: { key: T }): Features[T] =>
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    getValue() as Features[T];

function FlagProbe({ flagId }: { flagId: FeatureId }) {
  const { getFeature } = useFeatureFlags();
  const feature = getFeature(flagId);
  return <div data-testid="probe">{feature?.enabled ? "enabled" : "disabled"}</div>;
}

describe("FirebaseFeatureFlagsProvider", () => {
  beforeEach(() => {
    mockRemoteConfig.lastFetchTime = 0;
  });

  it("re-renders feature flag consumers when lastFetchTime changes", () => {
    let currentValue: Feature = { enabled: false };
    const getFeature = makeGetFeature(() => currentValue);

    const { rerender } = render(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <FlagProbe flagId="currencyAleo" />
      </FirebaseFeatureFlagsProvider>,
      { skipRouter: true },
    );

    expect(screen.getByTestId("probe")).toHaveTextContent("disabled");

    // Simulate Firebase pushing a new value at the next polling tick.
    currentValue = { enabled: true };
    act(() => {
      mockRemoteConfig.lastFetchTime = Date.now();
    });
    rerender(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <FlagProbe flagId="currencyAleo" />
      </FirebaseFeatureFlagsProvider>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent("enabled");
  });

  it("keeps the same context value identity when lastFetchTime is unchanged", () => {
    const identities = new Set<unknown>();
    function ContextIdentityProbe() {
      identities.add(useFeatureFlags());
      return null;
    }

    const getFeature = makeGetFeature(() => ({ enabled: false }));

    const { rerender } = render(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <ContextIdentityProbe />
      </FirebaseFeatureFlagsProvider>,
      { skipRouter: true },
    );
    rerender(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <ContextIdentityProbe />
      </FirebaseFeatureFlagsProvider>,
    );

    expect(identities.size).toBe(1);
  });

  it("produces a new context value identity on every lastFetchTime tick", () => {
    const identities = new Set<unknown>();
    function ContextIdentityProbe() {
      identities.add(useFeatureFlags());
      return null;
    }

    const getFeature = makeGetFeature(() => ({ enabled: false }));

    const { rerender } = render(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <ContextIdentityProbe />
      </FirebaseFeatureFlagsProvider>,
      { skipRouter: true },
    );

    act(() => {
      mockRemoteConfig.lastFetchTime = 1;
    });
    rerender(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <ContextIdentityProbe />
      </FirebaseFeatureFlagsProvider>,
    );

    act(() => {
      mockRemoteConfig.lastFetchTime = 2;
    });
    rerender(
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <ContextIdentityProbe />
      </FirebaseFeatureFlagsProvider>,
    );

    expect(identities.size).toBe(3);
  });
});
