import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();

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

  // verify that getOrCreateTrustchain is idempotent
  const { trustchain: t1, type: type1 } = await sdk1.getOrCreateTrustchain(
    deviceId,
    member1creds,
    callbacks,
  );
  expect(type1).toBe("created");
  expect(totalInteractionCounter).toBe(2); // there are two interaction: one for device auth, one for trustchain addition
  const { trustchain: t2, type: type2 } = await sdk1.getOrCreateTrustchain(
    deviceId,
    member1creds,
    callbacks,
  );
  expect(type2).toBe("restored");
  expect(totalInteractionCounter).toBe(3); // one more device auth interaction happened
  expect(t1).toEqual(t2);

  // verify that a second member can join the trustchain and get the same trustchain
  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();
  const { trustchain: t3, type: type3 } = await sdk2.getOrCreateTrustchain(
    deviceId,
    member2creds,
    callbacks,
  );
  expect(type3).toBe("updated");
  expect(t1).toEqual(t3);

  // check there are indeed our two members in the trustchain
  const members = await sdk1.getMembers(t1, member1creds);
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
  ]);

  // destroy
  await sdk1.destroyTrustchain(t1, member1creds);

  expect({
    interactionCounter,
    totalInteractionCounter,
  }).toEqual({
    interactionCounter: 0, // total of interaction+- is back at 0
    totalInteractionCounter: 5,
  });
}
