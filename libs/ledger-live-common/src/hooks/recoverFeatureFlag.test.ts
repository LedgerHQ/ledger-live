/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import {
  useReplacedURI,
  useUpsellURI,
  useAccountURI,
  useCustomURI,
  usePostOnboardingURI,
} from "./recoverFeatureFlag";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfig = any;

describe("useReplacedURI", () => {
  it("returns undefined when uri is missing", () => {
    const { result } = renderHook(() => useReplacedURI(undefined, "protect-staging"));
    expect(result.current).toBeUndefined();
  });

  it("returns undefined when id is missing", () => {
    const { result } = renderHook(() =>
      useReplacedURI("ledgerlive://recover/protect-prod", undefined),
    );
    expect(result.current).toBeUndefined();
  });

  it("replaces protect-prod placeholder with the active protectId", () => {
    const { result } = renderHook(() =>
      useReplacedURI(
        "ledgerlive://recover/protect-prod?redirectTo=upsell",
        "protect-staging",
      ),
    );
    expect(result.current).toBe("ledgerlive://recover/protect-staging?redirectTo=upsell");
  });

  it.each([
    "protect-simu",
    "protect-local-dev",
    "protect-local",
    "protect-staging",
    "protect-preprod",
    "protect-lumen-staging",
    "protect-lumen-preprod",
  ])("replaces %s placeholder with the active protectId", placeholder => {
    const { result } = renderHook(() =>
      useReplacedURI(`ledgerlive://recover/${placeholder}?redirectTo=login`, "protect-prod"),
    );
    expect(result.current).toBe("ledgerlive://recover/protect-prod?redirectTo=login");
  });

  it("is a no-op when the placeholder already matches the active protectId", () => {
    const uri =
      "ledgerlive://recover/protect-prod?redirectTo=upsell&ajs_recover_campaign=recover-launch";
    const { result } = renderHook(() => useReplacedURI(uri, "protect-prod"));
    expect(result.current).toBe(uri);
  });

  it("does not rewrite unrelated dashed segments such as recover-launch", () => {
    const { result } = renderHook(() =>
      useReplacedURI(
        "ledgerlive://recover/protect-prod?source=lld-restore-24&ajs_recover_campaign=recover-launch",
        "protect-staging",
      ),
    );
    expect(result.current).toBe(
      "ledgerlive://recover/protect-staging?source=lld-restore-24&ajs_recover_campaign=recover-launch",
    );
  });
});

describe("URI hooks template through useReplacedURI", () => {
  it("useUpsellURI substitutes protectId across the upsellURI param", () => {
    const config: AnyConfig = {
      enabled: true,
      params: {
        protectId: "protect-staging",
        onboardingCompleted: {
          upsellURI:
            "ledgerlive://recover/protect-prod?redirectTo=upsell&source=lld-onboarding-24",
        },
      },
    };
    const { result } = renderHook(() => useUpsellURI(config));
    expect(result.current).toBe(
      "ledgerlive://recover/protect-staging?redirectTo=upsell&source=lld-onboarding-24",
    );
  });

  it("useAccountURI substitutes protectId across the homeURI param", () => {
    const config: AnyConfig = {
      enabled: true,
      params: {
        protectId: "protect-staging",
        account: {
          homeURI:
            "ledgerlive://recover/protect-prod?source=lld-sidebar-navigation&ajs_recover_campaign=recover-launch",
        },
      },
    };
    const { result } = renderHook(() => useAccountURI(config));
    expect(result.current).toBe(
      "ledgerlive://recover/protect-staging?source=lld-sidebar-navigation&ajs_recover_campaign=recover-launch",
    );
  });

  it("useCustomURI builds the URI directly from protectId", () => {
    const config: AnyConfig = { enabled: true, params: { protectId: "protect-lumen-staging" } };
    const { result } = renderHook(() =>
      useCustomURI(config, "upsell", "lld-pairing", "recover-launch"),
    );
    expect(result.current).toContain("ledgerlive://recover/protect-lumen-staging");
    expect(result.current).toContain("redirectTo=upsell");
    expect(result.current).toContain("source=lld-pairing");
    expect(result.current).toContain("ajs_recover_campaign=recover-launch");
  });

  it("usePostOnboardingURI templates protectId on mobile config", () => {
    const config: AnyConfig = {
      enabled: true,
      params: {
        protectId: "protect-staging",
        onboardingRestore: {
          postOnboardingURI:
            "ledgerlive://recover/protect-prod?redirectTo=restore&source=llm-restore-24",
        },
      },
    };
    const { result } = renderHook(() => usePostOnboardingURI(config));
    expect(result.current).toBe(
      "ledgerlive://recover/protect-staging?redirectTo=restore&source=llm-restore-24",
    );
  });
});
