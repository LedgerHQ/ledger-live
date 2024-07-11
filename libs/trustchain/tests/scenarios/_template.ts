import Transport from "@ledgerhq/hw-transport";
import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(transport: Transport, { sdkForName }: ScenarioOptions) {
  /**
   * Edit this code to the test you want.
   * This script will be used both as a end-to-end tests and unit tests.
   * The end-to-end tests are used to generate mock for the same unit tests.
   */
  const name1 = "cli-member1";
  const sdk1 = sdkForName(name1);
  const memberCredentials = await sdk1.initMemberCredentials();
  const { trustchain } = await sdk1.getOrCreateTrustchain(transport, memberCredentials);

  await sdk1.destroyTrustchain(trustchain, memberCredentials);
}

// this can overrides the default config used by the recorder
export const recorderConfig = {};
