jest.unmock("@shared/analytics");
jest.unmock("../segment");
jest.unmock("~/renderer/analytics/segment");
jest.unmock("src/renderer/analytics/segment");

const mockIdentify = jest.fn();
const mockTrack = jest.fn();

jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn(() => ({
      identify: mockIdentify,
      track: mockTrack,
    })),
  },
}));

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    analyticsPage: jest.fn(),
    analyticsStart: jest.fn(),
    analyticsTrack: jest.fn(),
    onReduxAction: jest.fn(),
  },
}));

import { setContentAbTestCopy } from "@features/platform-content-ab-tests";
import { track, trackPage } from "@shared/analytics";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { startAnalytics } from "../segment";

const remoteValue = (raw: string) => ({
  asString: () => raw,
  getSource: () => "remote" as const,
});

const createStoreWithAnalytics = (language = "en") =>
  createStore({
    state: {
      settings: {
        ...SETTINGS_INITIAL_STATE,
        language,
        shareAnalytics: true,
        sharePersonalizedRecommandations: false,
      },
    } as State,
    fetchRemoteFlags: null,
  });

const sendIdentifyTrackAndPage = async (language = "en") => {
  await startAnalytics(createStoreWithAnalytics(language));
  const identifyTraits = mockIdentify.mock.calls.at(-1)![1];

  await track("TestEvent", {});
  const trackProps = mockTrack.mock.calls.at(-1)![1];

  await trackPage({ category: "AbTestsPage" });
  const pageProps = mockTrack.mock.calls.at(-1)![1];

  return [identifyTraits, trackProps, pageProps];
};

const withAbTests = (abTests: unknown) =>
  Array.from({ length: 3 }, () => expect.objectContaining({ ab_tests: abTests }));

describe("segment ab_tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContentAbTestCopy({});
  });

  it("sends an empty ab_tests object when no experiment is served", async () => {
    expect(await sendIdentifyTrackAndPage()).toEqual(withAbTests({}));
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

    expect(await sendIdentifyTrackAndPage()).toEqual(
      withAbTests({ upgradeBanner: { ab_upgrade: "variant_b", cohort: "q3" } }),
    );
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

    expect(await sendIdentifyTrackAndPage()).toEqual(withAbTests({}));
  });

  it("does not attribute an English copy experiment in another language", async () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: remoteValue(
        JSON.stringify({
          enabled: true,
          copy: { "upgrade.banner.title": "Discover Ledger Flex" },
          trackingConfiguration: { ab_upgrade: "variant_b" },
        }),
      ),
    });

    expect(await sendIdentifyTrackAndPage("fr")).toEqual(withAbTests({}));
  });
});
