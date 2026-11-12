import { track } from "@shared/analytics";
import { trackManageAgentsClick } from "../trackManageAgentsClick";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("trackManageAgentsClick", () => {
  it("should track the click with the profile source", () => {
    trackManageAgentsClick("My Wallet");

    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      button: "agent_intent",
      entry: "agent_intent",
      source: "profile",
      page: "My Wallet",
    });
  });
});
