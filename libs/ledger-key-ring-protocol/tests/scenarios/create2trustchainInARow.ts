import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const sdk = sdkForName("Foo");
  const creds = await sdk.initMemberCredentials();

  const t1 = await sdk.getOrCreateTrustchain(deviceId, creds);
  await sdk.destroyTrustchain(t1.trustchain, creds);
  expect(t1.type).toBe("created");

  const t2 = await sdk.getOrCreateTrustchain(deviceId, creds);
  await sdk.destroyTrustchain(t2.trustchain, creds);
  expect(t2.type).toBe("created");
}
