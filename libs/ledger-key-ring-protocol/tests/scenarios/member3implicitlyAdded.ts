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

  const name3 = "Member 3";
  const sdk3 = sdkForName(name3);
  const member3creds = await sdk3.initMemberCredentials();

  // auth with the device and init the first trustchain
  const { trustchain } = await sdk1.getOrCreateTrustchain(deviceId, member1creds);

  // member 1 adds member 2
  const member2 = { name: name2, id: member2creds.pubkey, permissions: 0xffffffff };
  await sdk1.addMember(trustchain, member1creds, member2);

  // member 3 do a getOrCreateTrustchain that should add itself implicitly
  const { trustchain: trustchain3 } = await sdk3.getOrCreateTrustchain(deviceId, member3creds);

  // list members
  const members = await sdk3.getMembers(trustchain3, member3creds);
  expect(members).toEqual([
    {
      id: member1creds.pubkey,
      name: name1,
      permissions: 0xffffffff,
    },
    {
      id: member2creds.pubkey,
      name: name2,
      permissions: 0xffffffff,
    },
    {
      id: member3creds.pubkey,
      name: name3,
      permissions: 0xffffffff,
    },
  ]);

  await sdk2.destroyTrustchain(trustchain, member2creds);
}
