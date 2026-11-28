import { track } from "@shared/analytics";
import { trackManageAgentsClick } from "../trackManageAgentsClick";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("trackManageAgentsClick", () => {
  it.each([true, false])(
    "should track the click with the profile source and newBadge %s",
    newBadge => {
      trackManageAgentsClick("My Wallet", newBadge);

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "agent_intent",
        entry: "agent_intent",
        source: "profile",
        page: "My Wallet",
        newBadge,
      });
    },
  );
});
