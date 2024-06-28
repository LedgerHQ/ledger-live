import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { RecorderConfig, recorderConfigDefaults } from "../test-helpers/types";

export async function scenario(transport: Transport) {
  const applicationId = 16;
  const sdk1 = getSdk(false, { applicationId, name: "Foo" });
  const memberCredentials = await sdk1.initMemberCredentials();
  await expect(sdk1.getOrCreateTrustchain(transport, memberCredentials)).rejects.toThrow(
    UserRefusedOnDevice,
  );
}

export const recorderConfig: RecorderConfig = {
  goNextOnText: recorderConfigDefaults.goNextOnText.concat(["Log in to"]),
  approveOnText: ["Cancel login"],
};
