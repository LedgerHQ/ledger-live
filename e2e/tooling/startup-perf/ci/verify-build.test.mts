import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUILD_CONFIG_MARKERS,
  type BuildCounts,
  countMarkers,
  DOT_ENV_MARKERS,
  judge,
  RES_VALUES_MARKERS,
} from "./verify-build.mts";

const PROD_LIKE: BuildCounts = { mock: 0, detox: 0, debug: 1, blurMock: 0, blurReal: 1 };

describe("countMarkers", () => {
  it("counts the lines of BuildConfig.java that set a test mode", () => {
    const config = [
      '  public static final String MOCK = "1";',
      '  public static final String FORCE_DEBUG_VISIBLE = "1";',
      '  public static final String MOCKED_URL = "x";',
    ].join("\n");
    const counts = countMarkers(config, BUILD_CONFIG_MARKERS, "a ReactNativeBlurView b\nc");
    assert.deepEqual(counts, { mock: 1, detox: 0, debug: 1, blurMock: 0, blurReal: 1 });
  });

  it("reads the resValues and the iOS dotenv the same way", () => {
    const resValues = '<string name="DETOX" translatable="false">1</string>';
    assert.equal(countMarkers(resValues, RES_VALUES_MARKERS, "").detox, 1);
    const dotEnv = '@{@"FORCE_DEBUG_VISIBLE":@"1",@"SWAP":@"x"}';
    assert.deepEqual(countMarkers(dotEnv, DOT_ENV_MARKERS, "BlurViewMock\nBlurViewMock"), {
      mock: 0,
      detox: 0,
      debug: 1,
      blurMock: 2,
      blurReal: 0,
    });
  });
});

describe("judge", () => {
  it("passes the prod-like build", () => {
    assert.deepEqual(judge(PROD_LIKE), { error: null, warning: null });
  });

  for (const [change, error] of [
    [{ debug: 0 }, /FORCE_DEBUG_VISIBLE=1 is not in the generated config/],
    [{ mock: 1 }, /MOCK or DETOX is still in the generated config/],
    [{ detox: 1 }, /MOCK or DETOX is still in the generated config/],
    [{ blurMock: 1 }, /still has the E2E blur mock/],
  ] as const) {
    it(`fails on ${JSON.stringify(change)}`, () => {
      assert.match(judge({ ...PROD_LIKE, ...change }).error ?? "", error);
    });
  }

  it("only warns when the real blur's marker is missing", () => {
    const { error, warning } = judge({ ...PROD_LIKE, blurReal: 0 });
    assert.equal(error, null);
    assert.match(warning ?? "", /no ReactNativeBlurView string/);
  });
});
