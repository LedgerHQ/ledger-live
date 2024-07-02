import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { ScenarioOptions } from "../test-helpers/types";

export async function scenario(transport: Transport, { pauseRecorder }: ScenarioOptions) {
  const applicationId = 16;
  const sdk = getSdk(false, { applicationId, name: "Foo" });
  const creds = await sdk.initMemberCredentials();
  const jwt = await sdk.authWithDevice(transport);
  await pauseRecorder(6 * 60 * 1000);
  // TODO: in future, we still want this covered by it will no longer crash. https://ledgerhq.atlassian.net/browse/LIVE-13168
  await expect(sdk.getOrCreateTrustchain(transport, jwt, creds)).rejects.toThrow();
}
