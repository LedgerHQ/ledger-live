import { ScenarioOptions } from "../test-helpers/types";

/**
 * a complete scenario with 3 members and various sdk successful interactions.
 */
export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  // members
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();

  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();
  const member2 = { name: name2, id: member2creds.pubkey, permissions: 0xffffffff };

  const name3 = "Member 3";
  const sdk3 = sdkForName(name3);
  const member3creds = await sdk3.initMemberCredentials();
  const member3 = { name: name3, id: member3creds.pubkey, permissions: 0xffffffff };

  const name4 = "Member 4";
  const sdk4 = sdkForName(name4);
  const member4creds = await sdk4.initMemberCredentials();

  // auth with the device and init the first trustchain
  const { trustchain } = await sdk1.getOrCreateTrustchain(deviceId, member1creds);

  // member 1 adds member 2
  await sdk1.addMember(trustchain, member1creds, member2);

  // member 1 adds member 3
  await sdk1.addMember(trustchain, member1creds, member3);

  // member 4 implicits add itself with device auth
  const { trustchain: trustchain4 } = await sdk4.getOrCreateTrustchain(deviceId, member4creds);
  expect(trustchain).toEqual(trustchain4);

  // list members
  const members = await sdk3.getMembers(trustchain, member3creds);
  expect(members.map(m => m.id)).toEqual([
    member1creds.pubkey,
    member2creds.pubkey,
    member3creds.pubkey,
    member4creds.pubkey,
  ]);

  await sdk2.destroyTrustchain(trustchain, member2creds);
}
