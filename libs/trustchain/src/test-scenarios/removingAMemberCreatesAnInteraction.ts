import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { getEnv } from "@ledgerhq/live-env";

export async function scenario(transport: Transport) {
  const applicationId = 16;

  const name1 = "Member 1";
  const sdk1 = getSdk(!!getEnv("MOCK"), { applicationId, name: name1 });
  const member1creds = await sdk1.initMemberCredentials();

  const name2 = "Member 2";
  const sdk2 = getSdk(!!getEnv("MOCK"), { applicationId, name: name2 });
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

  await sdk1.removeMember(transport, trustchain, member1creds, member2, callbacks);
  expect(totalInteractionCounter).toBe(3); // there are 1 interaction for trustchain addition

  // destroy the trustchain
  await sdk1.destroyTrustchain(trustchain, member1creds);
  expect(interactionCounter).toBe(0); // the start/stop is coherent
}
