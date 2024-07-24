import Transport from "@ledgerhq/hw-transport";
import { TrustchainEjected } from "../../src/errors";
import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(transport: Transport, { sdkForName }: ScenarioOptions) {
  // first member initializes itself
  const name1 = "Member 1";
  const sdk1 = sdkForName(name1);
  const member1creds = await sdk1.initMemberCredentials();

  // second member initializes itself
  const name2 = "Member 2";
  const sdk2 = sdkForName(name2);
  const member2creds = await sdk2.initMemberCredentials();

  // auth with the device and init the first trustchain
  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, member1creds);

  // now member2 will get an ejected error when trying to destroy the trustchain
  await expect(sdk2.destroyTrustchain(trustchain, member2creds)).rejects.toThrow(TrustchainEjected);

  // member1 can destroy the trustchain
  await sdk1.destroyTrustchain(trustchain, member1creds);
}
