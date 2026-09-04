import { ScreenName } from "~/const";
import { navigateSendFlowScreen } from "../navigateSendFlowScreen";

describe("navigateSendFlowScreen", () => {
  it("goes back when the target screen is already under the current one", () => {
    const goBack = jest.fn();
    const navigate = jest.fn();

    navigateSendFlowScreen(
      {
        getState: () => ({
          routes: [{ name: ScreenName.SendFlowAmount }, { name: ScreenName.SendFlowRecipient }],
          index: 1,
        }),
        goBack,
        navigate,
      },
      ScreenName.SendFlowAmount,
    );

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates when the target screen is not the previous route", () => {
    const goBack = jest.fn();
    const navigate = jest.fn();

    navigateSendFlowScreen(
      {
        getState: () => ({
          routes: [{ name: ScreenName.SendFlowAmount }],
          index: 0,
        }),
        goBack,
        navigate,
      },
      ScreenName.SendFlowRecipient,
    );

    expect(navigate).toHaveBeenCalledWith(ScreenName.SendFlowRecipient);
    expect(goBack).not.toHaveBeenCalled();
  });
});
