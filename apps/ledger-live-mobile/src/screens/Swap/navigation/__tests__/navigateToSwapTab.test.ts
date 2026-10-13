import { NavigatorName, ScreenName } from "~/const";
import { navigateToSwapTab } from "../navigateToSwapTab";

describe("navigateToSwapTab", () => {
  const createNavigation = () => {
    const navigate = jest.fn();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return { navigation: { navigate } as never, navigate };
  };

  const params = { toTokenId: "ethereum", fromPath: "Portfolio" };

  it("targets the Main > Swap tab, popping back to the existing Main", () => {
    const { navigation, navigate } = createNavigation();

    navigateToSwapTab({ navigation, params });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      NavigatorName.Main,
      {
        screen: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
          params,
        },
      },
      { pop: true },
    );
  });

  it("defaults to empty params when none are provided (opens Swap with no preselection)", () => {
    const { navigation, navigate } = createNavigation();

    navigateToSwapTab({ navigation });

    expect(navigate).toHaveBeenCalledWith(
      NavigatorName.Main,
      {
        screen: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
          params: {},
        },
      },
      { pop: true },
    );
  });
});
