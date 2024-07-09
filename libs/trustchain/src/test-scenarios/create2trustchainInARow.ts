import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { getEnv } from "@ledgerhq/live-env";

export async function scenario(transport: Transport) {
  const applicationId = 16;
  const sdk = getSdk(!!getEnv("MOCK"), { applicationId, name: "Foo" });
  const creds = await sdk.initMemberCredentials();

  const t1 = await sdk.getOrCreateTrustchain(transport, creds);
  await sdk.destroyTrustchain(t1.trustchain, creds);
  expect(t1.type).toBe("created");

  const t2 = await sdk.getOrCreateTrustchain(transport, creds);
  await sdk.destroyTrustchain(t2.trustchain, creds);
  expect(t2.type).toBe("created");
}
