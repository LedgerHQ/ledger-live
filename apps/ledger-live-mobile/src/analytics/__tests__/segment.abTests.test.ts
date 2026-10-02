import { track } from "@shared/analytics";
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import { setContentAbTestCopy } from "@features/platform-content-ab-tests";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo, setLanguage } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

const { _identifyMock: mockIdentify, _trackMock: mockTrack } =
  require("@segment/analytics-react-native") as {
    _identifyMock: jest.Mock;
    _trackMock: jest.Mock;
  };

const remoteValue = (raw: string) => ({
  asString: () => raw,
  getSource: () => "remote" as const,
});

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  }) as AppStore;

describe("segment ab_tests", () => {
  let store: AppStore;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    setContentAbTestCopy({});
    store = makeStore();
    store.dispatch(
      setAnalyticsConsentInfo({ consentDate: "2026-04-29T00:00:00.000Z", privacyPolicyVersion: 1 }),
    );
    store.dispatch(setAnalytics(true));
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  const trackTestEvent = async () => {
    await segment.start(store);
    const identifyTraits = mockIdentify.mock.calls.at(-1)[1];
    mockTrack.mockClear();

    track("TestEvent", {});

    await waitFor(() => expect(mockTrack).toHaveBeenCalledWith("TestEvent", expect.anything()));
    return { identifyTraits, eventProperties: mockTrack.mock.calls.at(-1)[1] };
  };

  it("sends an empty ab_tests object when no experiment is served", async () => {
    const { identifyTraits, eventProperties } = await trackTestEvent();

    expect(identifyTraits).toHaveProperty("ab_tests", {});
    expect(eventProperties).toHaveProperty("ab_tests", {});
  });

  it("sends the tracking pairs of each enabled experiment", async () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: remoteValue(
        JSON.stringify({
          enabled: true,
          copy: { "upgrade.banner.title": "Discover Ledger Flex" },
          trackingConfiguration: { ab_upgrade: "variant_b", cohort: "q3" },
        }),
      ),
    });

    const { identifyTraits, eventProperties } = await trackTestEvent();
    const expectedAbTests = {
      upgradeBanner: { ab_upgrade: "variant_b", cohort: "q3" },
    };

    expect(identifyTraits).toEqual(
      expect.objectContaining({
        ab_tests: expectedAbTests,
      }),
    );
    expect(eventProperties).toEqual(expect.objectContaining({ ab_tests: expectedAbTests }));
  });

  it("sends an empty ab_tests object when experiments are disabled or malformed", async () => {
    setContentAbTestCopy({
      feature_copy_broken: remoteValue("not json"),
      feature_copy_disabled: remoteValue(
        JSON.stringify({
          enabled: false,
          copy: { "upgrade.banner.title": "Hidden" },
          trackingConfiguration: { ab_hidden: "variant_b" },
        }),
      ),
    });

    const { identifyTraits, eventProperties } = await trackTestEvent();

    expect(identifyTraits).toHaveProperty("ab_tests", {});
    expect(eventProperties).toHaveProperty("ab_tests", {});
  });

  it("does not attribute an English copy experiment in another language", async () => {
    store.dispatch(setLanguage("fr"));
    setContentAbTestCopy({
      feature_copy_upgrade_banner: remoteValue(
        JSON.stringify({
          enabled: true,
          copy: { "upgrade.banner.title": "Discover Ledger Flex" },
          trackingConfiguration: { ab_upgrade: "variant_b" },
        }),
      ),
    });

    const { identifyTraits, eventProperties } = await trackTestEvent();

    expect(identifyTraits).toHaveProperty("ab_tests", {});
    expect(eventProperties).toHaveProperty("ab_tests", {});
  });
});
