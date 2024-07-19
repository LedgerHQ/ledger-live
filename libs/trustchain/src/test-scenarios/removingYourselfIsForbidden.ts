import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { getEnv } from "@ledgerhq/live-env";

export async function scenario(transport: Transport) {
  const applicationId = 16;
  const name1 = "Member 1";
  const sdk1 = getSdk(!!getEnv("MOCK"), { applicationId, name: name1 });
  const member1creds = await sdk1.initMemberCredentials();
  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, member1creds);
  const members = await sdk1.getMembers(trustchain, member1creds);
  await expect(
    sdk1.removeMember(transport, trustchain, member1creds, members[0]),
  ).rejects.toThrow();
  await sdk1.destroyTrustchain(trustchain, member1creds);
}
