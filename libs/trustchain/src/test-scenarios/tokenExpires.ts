import Transport from "@ledgerhq/hw-transport";
import { ScenarioOptions } from "../test-helpers/types";
import { getSdk } from "..";

export async function scenario(transport: Transport, { pauseRecorder }: ScenarioOptions) {
  const applicationId = 16;
  const sdk = getSdk(false, { applicationId, name: "Foo" });
  const creds = await sdk.initMemberCredentials();

  const jwt1 = await sdk.withDeviceAuth(transport, jwt => Promise.resolve(jwt));
  await pauseRecorder(6 * 60 * 1000);
  const { trustchain } = await sdk.getOrCreateTrustchain(transport, creds);
  const jwt2 = await sdk.withDeviceAuth(transport, jwt2 => Promise.resolve(jwt2));
  // assert that jwt was refreshed (due to the expiration)
  expect(jwt1).not.toEqual(jwt2);
  await sdk.destroyTrustchain(trustchain, creds);
}
