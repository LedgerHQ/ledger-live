import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const name1 = "Member 1";
  const sdk = sdkForName(name1);
  const member1creds = await sdk.initMemberCredentials();
  const { trustchain } = await sdk.getOrCreateTrustchain(deviceId, member1creds);

  const name2 = "Member 2";
  const member2creds = await sdk.initMemberCredentials();
  const member2 = { name: name2, id: member2creds.pubkey, permissions: 0xffffffff };

  await sdk.addMember(trustchain, member1creds, member2);
  await sdk.addMember(trustchain, member1creds, member2);

  const members = await sdk.getMembers(trustchain, member1creds);
  await sdk.destroyTrustchain(trustchain, member1creds);

  expect(members.length).toBe(2);
}
