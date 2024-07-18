import Transport from "@ledgerhq/hw-transport";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { RecorderConfig, ScenarioOptions } from "../test-helpers/types";

export async function scenario(transport: Transport, { sdkForName }: ScenarioOptions) {
  // first member initializes itself
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();
  const member1 = { id: member1creds.pubkey, name: name1, permissions: 0xffffffff };

  // auth with the device and init the first trustchain
  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, member1creds);

  // second member initializes itself
  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();
  const member2 = { id: member2creds.pubkey, name: name2, permissions: 0xffffffff };

  // member1 adds member2 (= qr code flow)
  await sdk1.addMember(trustchain, member1creds, member2);

  // list members and verify it's correct
  expect(await sdk2.getMembers(trustchain, member2creds)).toEqual([member1, member2]);

  // member1 refuses to remove member2
  let interactionCounter = 0;
  let totalInteractionCounter = 0;
  const callbacks = {
    onStartRequestUserInteraction: () => {
      totalInteractionCounter++;
      interactionCounter++;
    },
    onEndRequestUserInteraction: () => {
      interactionCounter--;
    },
  };
  await expect(
    sdk1.removeMember(transport, trustchain, member1creds, member2, callbacks),
  ).rejects.toThrow(UserRefusedOnDevice);
  expect(interactionCounter).toBe(0);
  expect(totalInteractionCounter).toBe(2);

  // make sure the member2 is still there
  expect(await sdk2.getMembers(trustchain, member2creds)).toEqual([member1, member2]);
}

export const recorderConfig: RecorderConfig = {
  approveOnceOnText: ["Enable"], // Approve the first interaction (After login)
  approveOnText: ["Log in to", "Don't enable"],

  goNextOnText: [
    // Login:
    ...["Login request", "Identify with your", "request?", "Ensure you trust the"],

    // Refuse the second interaction (remove member):
    "Enable",
  ],
};
