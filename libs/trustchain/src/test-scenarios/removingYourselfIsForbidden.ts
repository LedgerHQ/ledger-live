import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";

export async function scenario(transport: Transport) {
  const applicationId = 16;
  const name1 = "Member 1";
  const sdk1 = getSdk(false, { applicationId, name: name1 });
  const member1creds = await sdk1.initMemberCredentials();
  const initialJwt = await sdk1.authWithDevice(transport);
  const { trustchain, jwt } = await sdk1.getOrCreateTrustchain(transport, initialJwt, member1creds);
  const members = await sdk1.getMembers(jwt, trustchain);
  await expect(
    sdk1.removeMember(transport, jwt, trustchain, member1creds, members[0]),
  ).rejects.toThrow();
  await sdk1.destroyTrustchain(trustchain, jwt);
}
