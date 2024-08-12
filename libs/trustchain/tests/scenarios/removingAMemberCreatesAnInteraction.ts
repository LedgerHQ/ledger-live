import Transport from "@ledgerhq/hw-transport";
import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(transport: Transport, { sdkForName }: ScenarioOptions) {
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();

  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();
  const member2 = { name: name2, id: member2creds.pubkey, permissions: 0xffffffff };

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

  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, member1creds, callbacks);
  expect(totalInteractionCounter).toBe(2); // there are two interaction: one for device auth, one for trustchain addition

  await sdk1.addMember(trustchain, member1creds, member2);

  const newTrustchain = await sdk1.removeMember(
    transport,
    trustchain,
    member1creds,
    member2,
    callbacks,
  );
  expect(totalInteractionCounter).toBe(4); // there are 2 interactions for trustchain addition

  // destroy the trustchain
  await sdk1.destroyTrustchain(newTrustchain, member1creds);
  expect(interactionCounter).toBe(0); // the start/stop is coherent
}
