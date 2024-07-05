import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { ScenarioOptions } from "../test-helpers/types";
import { getEnv } from "@ledgerhq/live-env";

export async function scenario(transport: Transport, { switchDeviceSeed }: ScenarioOptions) {
  const applicationId = 16;
  const name1 = "Member 1";
  const sdk1 = getSdk(!!getEnv("MOCK"), { applicationId, name: name1 });
  const member1creds = await sdk1.initMemberCredentials();
  const member1 = { name: name1, id: member1creds.pubkey, permissions: 0xffffffff };

  const name2 = "Member 2";
  const sdk2 = getSdk(!!getEnv("MOCK"), { applicationId, name: name2 });
  const member2creds = await sdk2.initMemberCredentials();
  const member2 = { name: name2, id: member2creds.pubkey, permissions: 0xffffffff };

  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, member1creds);
  await sdk1.addMember(trustchain, member1creds, member2);
  transport = await switchDeviceSeed();

  // Test that we can't remove member1 because we are not using the device that corresponds to the trustchain
  // TODO: in future, we expect a precise error. https://ledgerhq.atlassian.net/browse/LIVE-13168
  await expect(sdk2.removeMember(transport, trustchain, member2creds, member1)).rejects.toThrow();

  await sdk2.destroyTrustchain(trustchain, member2creds);
}
