import { device } from "detox";
import { execSync } from "child_process";
import * as bridge from "./bridge/server";

beforeAll(async () => {
  bridge.init();
  await device.launchApp({
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
  });
}, 350000);

afterAll(async () => {
  bridge.close();
});

// NOTE: https://github.com/wix/Detox/blob/master/docs/APIRef.Screenshots.md
async function setDemoMode() {
  // FIXME: commands does nothing and sometimes causes crashes (we tried locally), so we commented it out, however
  // when we start using screenshots for testing, we will probably need to look into itx`
  //
  // if (device.getPlatform() === "ios") {
  //   execSync(
  //     `xcrun simctl status_bar booted override --time "12:00" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularMode active --cellularBars 4`,
  //   );
  // }
  if (device.getPlatform() !== "ios") {
    // enter demo mode
    execSync("adb shell settings put global sysui_demo_allowed 1");
    // display time 12:00
    execSync(
      "adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200",
    );
    // Display full mobile data with 4g type and no wifi
    execSync(
      "adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e datatype 4g -e wifi false",
    );
    // Hide notifications
    execSync(
      "adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false",
    );
    // Show full battery but not in charging state
    execSync(
      "adb shell am broadcast -a com.android.systemui.demo -e command battery -e plugged false -e level 100",
    );
  }
}
