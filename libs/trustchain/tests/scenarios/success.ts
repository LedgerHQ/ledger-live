import Transport from "@ledgerhq/hw-transport";
import { ScenarioOptions } from "../test-helpers/types";

/**
 * a complete scenario with 3 members and various sdk successful interactions.
 */
export async function scenario(transport: Transport, { sdkForName }: ScenarioOptions) {
  // first member initializes itself
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();

  // auth with the device and init the first trustchain
  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, member1creds);

  // verify we have member 1 in the trustchain
  const members = await sdk1.getMembers(trustchain, member1creds);
  expect(members).toEqual([
    {
      id: member1creds.pubkey,
      name: name1,
      permissions: 0xffffffff,
    },
  ]);

  // second member initializes itself
  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();

  // member 1 adds member 2 (= qr code flow)
  await sdk1.addMember(trustchain, member1creds, {
    name: name2,
    id: member2creds.pubkey,
    permissions: 0xffffffff,
  });

  // member2 list members and verify it's correct
  const members2 = await sdk2.getMembers(trustchain, member2creds);
  const expectedMembers = [
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
  ];
  expect(members2).toEqual(expectedMembers);

  // third member initializes itself
  const name3 = "Member 3";
  const sdk3 = sdkForName(name3);
  const member3creds = await sdk3.initMemberCredentials();

  // member 2 adds member 3
  await sdk2.addMember(trustchain, member2creds, {
    name: name3,
    id: member3creds.pubkey,
    permissions: 0xffffffff,
  });
  expectedMembers.push({
    id: member3creds.pubkey,
    name: name3,
    permissions: 0xffffffff,
  });

  // member1 can also list members and see third member
  const members1 = await sdk1.getMembers(trustchain, member1creds);
  expect(members1).toEqual(expectedMembers);

  // as well as member3 itself
  expect(await sdk3.getMembers(trustchain, member3creds)).toEqual(expectedMembers);

  // member1 removes member2
  const newTrustchain = await sdk1.removeMember(transport, trustchain, member1creds, members2[1]);
  expectedMembers.splice(1, 1);

  // verify the trustchain has rotated
  expect(newTrustchain.walletSyncEncryptionKey).not.toBe(trustchain.walletSyncEncryptionKey);
  expect(newTrustchain.applicationPath).not.toBe(trustchain.applicationPath);

  // member1 can still list members
  expect(await sdk1.getMembers(newTrustchain, member1creds)).toEqual(expectedMembers);

  // member3 that may not have refreshed yet, can now restore the trustchain
  const restored = await sdk3.restoreTrustchain(trustchain, member3creds);
  expect(restored).toEqual(newTrustchain);

  // member2 destroy the trustchain
  await sdk2.destroyTrustchain(trustchain, member2creds);
}

// this can overrides the default config used by the recorder
export const recorderConfig = {
  goNextOnText: ["Login request", "Identify with your", "request?", "Ensure you trust the"],
  approveOnText: ["Log in to", "Enable"],
};
