import { ScenarioOptions } from "../test-helpers/types";

// When the application being deactivated is the last open one of the trustchain,
// destroyApplication destroys the whole trustchain (the previous behaviour).
export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const sdk = sdkForName("Sole member");
  const creds = await sdk.initMemberCredentials();
  const { trustchain } = await sdk.getOrCreateTrustchain(deviceId, creds);

  const { trustchainDestroyed } = await sdk.destroyApplication(trustchain, creds);
  expect(trustchainDestroyed).toBe(true);

  // the trustchain no longer exists: a new getOrCreateTrustchain recreates it
  const recreated = await sdk.getOrCreateTrustchain(deviceId, creds);
  expect(recreated.type).toBe("created");

  // cleanup
  await sdk.destroyTrustchain(recreated.trustchain, creds);
}
