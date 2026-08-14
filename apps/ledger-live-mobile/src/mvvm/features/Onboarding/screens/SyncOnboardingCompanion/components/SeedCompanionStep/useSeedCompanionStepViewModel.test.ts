import { Linking } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { useSeedCompanionStepViewModel } from "./useSeedCompanionStepViewModel";

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

describe("useSeedCompanionStepViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("tracks the Learn More click and opens the shop URL", () => {
    const { result } = renderHook(() => useSeedCompanionStepViewModel());

    act(() => {
      result.current.handleLearnMoreClick();
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
      flow: "onboarding",
    });
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://shop.ledger.com/products/ledger-recovery-key",
    );
  });
});
