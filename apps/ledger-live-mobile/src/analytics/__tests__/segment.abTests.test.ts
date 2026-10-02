import { track } from "@shared/analytics";
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import { setContentAbTestCopy } from "@features/platform-content-ab-tests";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
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
    mockTrack.mockClear();

    track("TestEvent", {});

    await waitFor(() => expect(mockTrack).toHaveBeenCalledWith("TestEvent", expect.anything()));
    return mockTrack.mock.calls.at(-1)[1];
  };

  it("leaves ab_tests out when no experiment is served", async () => {
    expect(await trackTestEvent()).not.toHaveProperty("ab_tests");
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

    expect(await trackTestEvent()).toEqual(
      expect.objectContaining({
        ab_tests: { upgradeBanner: { ab_upgrade: "variant_b", cohort: "q3" } },
      }),
    );
  });

  it("leaves ab_tests out when experiments are disabled or malformed", async () => {
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

    expect(await trackTestEvent()).not.toHaveProperty("ab_tests");
  });
});
