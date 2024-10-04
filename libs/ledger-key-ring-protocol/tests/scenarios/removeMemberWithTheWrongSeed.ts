import { ScenarioOptions } from "../test-helpers/types";
import { TrustchainNotAllowed } from "../../src/errors";

export async function scenario(
  deviceId: string,
  { sdkForName, switchDeviceSeed }: ScenarioOptions,
) {
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();
  const member1 = { name: name1, id: member1creds.pubkey, permissions: 0xffffffff };

  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();
  const member2 = { name: name2, id: member2creds.pubkey, permissions: 0xffffffff };

  const { trustchain } = await sdk1.getOrCreateTrustchain(deviceId, member1creds);
  await sdk1.addMember(trustchain, member1creds, member2);

  const device = await switchDeviceSeed();

  await expect(sdk1.removeMember(device.id, trustchain, member2creds, member1)).rejects.toThrow(
    TrustchainNotAllowed,
  );

  await sdk2.destroyTrustchain(trustchain, member2creds);
}
