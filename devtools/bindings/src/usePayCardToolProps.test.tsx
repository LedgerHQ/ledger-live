import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import {
  payCardFeatureTourSlice,
  markPayCardFeatureTourSeen,
} from "@features/flow-pay-feature-tour/state";
import {
  payRequestVerifyHintSlice,
  markReceiveVerifyHintSeen,
} from "@features/flow-pay-request/state";
import { cardApi } from "@shared/api-services";
import {
  payCardLoginIntroSlice,
  markPayCardLoginIntroSeen,
} from "@features/flow-pay-card-auth/state";
import { usePayCardToolProps } from "./usePayCardToolProps";

/**
 * `@shared/env` is mocked, as in `useEnvDevToolProps.test.ts`. The real module reads its definitions
 * from `@ledgerhq/live-env`, which this package does not depend on, so CI cannot resolve it.
 */
const DEFAULT_ENV_VALUES: Record<string, string> = {
  CARD_API_URL: "https://card.api.live.ledger.com",
  CARD_BAANX_CLIENT_KEY: "",
};
let envValues: Record<string, string> = { ...DEFAULT_ENV_VALUES };
let envListener: ((change: { name: string }) => void) | undefined;

const mockSetEnvUnsafe = jest.fn((key: string, value: string) => {
  envValues[key] = value;
  envListener?.({ name: key });
});

jest.mock("@shared/env", () => ({
  getEnv: (key: string) => envValues[key],
  setEnvUnsafe: (key: string, value: string) => mockSetEnvUnsafe(key, value),
  changes: {
    subscribe: (listener: (change: { name: string }) => void) => {
      envListener = listener;
      return {
        unsubscribe: () => {
          envListener = undefined;
        },
      };
    },
  },
}));

function buildStore() {
  return configureStore({
    reducer: {
      featureFlags: featureFlagsReducer,
      payCardFeatureTour: payCardFeatureTourSlice.reducer,
      payRequestVerifyHint: payRequestVerifyHintSlice.reducer,
      // The tool reads the Card endpoints, so its api has to be part of the store under test.
      [cardApi.reducerPath]: cardApi.reducer,
      payCardLoginIntro: payCardLoginIntroSlice.reducer,
    },
    middleware: gdm =>
      gdm()
        .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }))
        .concat(cardApi.middleware),
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

describe("usePayCardToolProps", () => {
  let store: ReturnType<typeof buildStore>;

  beforeEach(() => {
    store = buildStore();
    envValues = { ...DEFAULT_ENV_VALUES };
    mockSetEnvUnsafe.mockClear();
  });

  it("exposes desktop onboarding steps and default flag values", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.onboarding.steps.map(step => step.id)).toEqual([
      "kyc",
      "claim",
      "topup",
      "purchase",
    ]);
    expect(result.current.flags.payTabEnabled).toBe(false);
    expect(result.current.flags.ptxCardEnabled).toBe(false);
  });

  it("includes walletPay when platform is native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    expect(result.current.onboarding.steps.map(step => step.id)).toEqual([
      "kyc",
      "claim",
      "topup",
      "walletPay",
      "purchase",
    ]);
  });

  it("setPayTabEnabled overrides lwdPayTab on web", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.lwdPayTab?.enabled).toBe(true);
    expect(store.getState().featureFlags.overrides.lwmPayTab).toBeUndefined();
    expect(result.current.flags.payTabEnabled).toBe(true);
  });

  it("setPayTabEnabled overrides lwmPayTab on native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.lwmPayTab?.enabled).toBe(true);
    expect(store.getState().featureFlags.overrides.lwdPayTab).toBeUndefined();
    expect(result.current.flags.payTabEnabled).toBe(true);
  });

  it("setCardParam updates params.card on lwdPayTab on web", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });
    act(() => {
      result.current.flags.setCardParam(false);
    });

    expect(store.getState().featureFlags.overrides.lwdPayTab?.params?.card).toBe(false);
    expect(store.getState().featureFlags.overrides.lwmPayTab).toBeUndefined();
    expect(result.current.flags.cardParam).toBe(false);
  });

  it("setCardParam updates params.card on lwmPayTab on native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });
    act(() => {
      result.current.flags.setCardParam(false);
    });

    expect(store.getState().featureFlags.overrides.lwmPayTab?.params?.card).toBe(false);
    expect(store.getState().featureFlags.overrides.lwdPayTab).toBeUndefined();
    expect(result.current.flags.cardParam).toBe(false);
  });

  it("setPtxCardEnabled overrides ptxCard", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPtxCardEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.ptxCard?.enabled).toBe(true);
    expect(result.current.flags.ptxCardEnabled).toBe(true);
  });

  it("setStepDone toggles a single step and supports resetting all", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.onboarding.setStepDone("kyc", true);
    });
    expect(result.current.onboarding.steps.find(step => step.id === "kyc")?.done).toBe(true);

    act(() => {
      result.current.onboarding.setStepDone("all", false);
    });
    expect(result.current.onboarding.steps.every(step => !step.done)).toBe(true);
  });

  it("exposes hasSeenFeatureTour from the payCard slice", () => {
    store.dispatch(markPayCardFeatureTourSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenFeatureTour).toBe(true);
  });

  it("exposes hasSeenLoginIntro from the payCard slice", () => {
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenLoginIntro).toBe(true);
  });

  it("exposes the two Card env vars, with the development tenant as the suggestion", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.env.vars).toEqual([
      {
        key: "CARD_API_URL",
        value: "https://card.api.live.ledger.com",
        suggestedValue: "https://dev.api.baanx.com",
      },
      {
        key: "CARD_BAANX_CLIENT_KEY",
        value: "",
        suggestedValue: "dc16bbda-eb1b-487c-be60-1a90ca7c9dd6",
      },
    ]);
  });

  it("setVar changes the env, and the value it reports follows", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.env.setVar("CARD_API_URL", "https://card.staging.test");
    });

    expect(mockSetEnvUnsafe).toHaveBeenCalledWith("CARD_API_URL", "https://card.staging.test");
    expect(result.current.env.vars[0]?.value).toBe("https://card.staging.test");
  });

  it("follows a change made outside the tool, and ignores every other env", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      envValues.CARD_BAANX_CLIENT_KEY = "another-tenant-key";
      envListener?.({ name: "SOME_OTHER_ENV" });
    });
    expect(result.current.env.vars[1]?.value).toBe("");

    act(() => {
      envListener?.({ name: "CARD_BAANX_CLIENT_KEY" });
    });
    expect(result.current.env.vars[1]?.value).toBe("another-tenant-key");
  });

  it("resetPayCardFeatureTourSeen clears the seen flag", () => {
    store.dispatch(markPayCardFeatureTourSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardFeatureTourSeen();
    });

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(false);
    expect(result.current.hasSeenFeatureTour).toBe(false);
  });

  it("exposes hasSeenReceiveVerifyHint from the request verify hint slice", () => {
    store.dispatch(markReceiveVerifyHintSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenReceiveVerifyHint).toBe(true);
  });

  it("resetReceiveVerifyHintSeen clears the seen flag", () => {
    store.dispatch(markReceiveVerifyHintSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetReceiveVerifyHintSeen();
    });

    expect(store.getState().payRequestVerifyHint.hasSeenReceiveVerifyHint).toBe(false);
    expect(result.current.hasSeenReceiveVerifyHint).toBe(false);
  });

  it("resetPayCardLoginIntroSeen clears the seen flag", () => {
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardLoginIntroSeen();
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(result.current.hasSeenLoginIntro).toBe(false);
  });

  it("keeps the two reset actions apart", () => {
    store.dispatch(markPayCardFeatureTourSeen());
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardLoginIntroSeen();
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
  });
});
