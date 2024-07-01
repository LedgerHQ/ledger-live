import Transport from "@ledgerhq/hw-transport";
import { getSdk } from "..";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { RecorderConfig, recorderConfigDefaults } from "../test-helpers/types";

export async function scenario(transport: Transport) {
  const applicationId = 16;
  const sdk1 = getSdk(false, { applicationId, name: "Foo" });
  const memberCredentials = await sdk1.initMemberCredentials();
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
  await expect(sdk1.getOrCreateTrustchain(transport, memberCredentials, callbacks)).rejects.toThrow(
    UserRefusedOnDevice,
  );
  expect(interactionCounter).toBe(0);
  expect(totalInteractionCounter).toBe(1);
}

export const recorderConfig: RecorderConfig = {
  goNextOnText: recorderConfigDefaults.goNextOnText.concat(["Log in to"]),
  approveOnText: ["Cancel login"],
};
