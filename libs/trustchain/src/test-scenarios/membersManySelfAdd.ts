import { getEnv } from "@ledgerhq/live-env";
import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";

export async function scenario(transport: Transport) {
  const applicationId = 16;

  let trustchainId;
  const n = 10;
  for (let i = 1; i < n; i++) {
    const name = "Member " + i;
    const sdk = getSdk(!!getEnv("MOCK"), { applicationId, name });
    const creds = await sdk.initMemberCredentials();
    const { trustchain } = await sdk.getOrCreateTrustchain(transport, creds);
    if (!trustchainId) trustchainId = trustchain.rootId;
    expect(trustchain.rootId).toBe(trustchainId);
    if (i === n - 1) {
      // cleanup
      await sdk.destroyTrustchain(trustchain, creds);
    }
  }
}
