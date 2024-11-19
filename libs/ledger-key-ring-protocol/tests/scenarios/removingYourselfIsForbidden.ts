import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();
  const { trustchain } = await sdk1.getOrCreateTrustchain(deviceId, member1creds);
  const members = await sdk1.getMembers(trustchain, member1creds);
  await expect(sdk1.removeMember(deviceId, trustchain, member1creds, members[0])).rejects.toThrow();
  await sdk1.destroyTrustchain(trustchain, member1creds);
}
