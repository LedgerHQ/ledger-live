import { SEND_FLOW_SOURCE } from "@ledgerhq/live-common/flows/send/types";
import { ScreenName } from "~/const";
import { getSendSuccessScreenName } from "../getSendSuccessScreenName";

describe("getSendSuccessScreenName", () => {
  it("should open pay success when the send source is Pay", () => {
    expect(getSendSuccessScreenName(SEND_FLOW_SOURCE.PAY)).toBe(ScreenName.SendFlowPaySuccess);
  });

  it("should open confirmation when the send source is not Pay", () => {
    expect(getSendSuccessScreenName("Asset Detail")).toBe(ScreenName.SendFlowConfirmation);
    expect(getSendSuccessScreenName()).toBe(ScreenName.SendFlowConfirmation);
  });
});
