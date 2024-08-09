import Transport from "@ledgerhq/hw-transport";
import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(transport: Transport, { sdkForName }: ScenarioOptions) {
  const sdk = sdkForName("Foo");
  const creds = await sdk.initMemberCredentials();

  const t1 = await sdk.getOrCreateTrustchain(transport, creds);
  await sdk.destroyTrustchain(t1.trustchain, creds);
  expect(t1.type).toBe("created");

  const t2 = await sdk.getOrCreateTrustchain(transport, creds);
  await sdk.destroyTrustchain(t2.trustchain, creds);
  expect(t2.type).toBe("created");
}
