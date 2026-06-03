import { DeviceModelId } from "@ledgerhq/devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { discoverWalletMock } from "../mockActions";

describe("discoverWalletMock", () => {
  it("should navigate to the mock action screen", () => {
    if (!("getNavigationParams" in discoverWalletMock)) {
      throw new Error("discoverWalletMock is expected to define getNavigationParams");
    }

    expect(
      discoverWalletMock.getNavigationParams({
        deviceModelId: DeviceModelId.nanoX,
        protectId: "",
      }),
    ).toEqual([
      NavigatorName.PostOnboarding,
      {
        screen: ScreenName.PostOnboardingMockActionScreen,
        params: {
          id: PostOnboardingActionId.discoverWalletMock,
          title: PostOnboardingActionId.discoverWalletMock,
        },
      },
    ]);
  });
});
