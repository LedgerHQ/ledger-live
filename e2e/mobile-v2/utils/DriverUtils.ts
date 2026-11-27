/* Switch to the native app context whilst maintaining state */
export async function switchToNativeApp() {
  await driver.switchAppiumContext("NATIVE_APP");
  driver.capabilities["custom:state"].switchedWebview = undefined;
}
