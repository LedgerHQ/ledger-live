import { StackActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { navigateToPayTab } from "../navigateToPayTab";

describe("navigateToPayTab", () => {
  it("should replace to the Pay tab screen", () => {
    const dispatch = jest.fn();

    navigateToPayTab({ dispatch });

    expect(dispatch).toHaveBeenCalledWith(
      StackActions.replace(NavigatorName.Main, {
        screen: NavigatorName.PayTab,
        params: { screen: ScreenName.PayTab },
      }),
    );
  });
});
