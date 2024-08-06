import { ScenarioOptions } from "../test-helpers/types";
import { HWDeviceProvider } from "../../src/HWDeviceProvider";
import { SDK } from "../../src/sdk";
import { getEnv } from "@ledgerhq/live-env";

export async function scenario(deviceId: string, { withDevice, pauseRecorder }: ScenarioOptions) {
  const apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING");
  const hwDeviceProvider = new HWDeviceProvider(apiBaseUrl, withDevice);
  const applicationId = 16;
  const sdk = new SDK({ applicationId, name: "Foo", apiBaseUrl }, hwDeviceProvider);
  const creds = await sdk.initMemberCredentials();

  const jwt1 = await hwDeviceProvider.withJwt(deviceId, jwt => Promise.resolve(jwt));
  await pauseRecorder(6 * 60 * 1000);
  const { trustchain } = await sdk.getOrCreateTrustchain(deviceId, creds);
  const jwt2 = await hwDeviceProvider.withJwt(deviceId, jwt2 => Promise.resolve(jwt2));
  // assert that jwt was refreshed (due to the expiration)
  expect(jwt1).not.toEqual(jwt2);
  await sdk.destroyTrustchain(trustchain, creds);
}
