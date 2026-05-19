import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { tickProductTourDeeplink } from "~/actions/appstate";
import { navigateToPortfolioWalletTab } from "~/navigation/navigateToPortfolioWalletTab";

type ActionHandler = () => void;

type PostOnboardingActionHandlers = {
  [key in PostOnboardingActionId]?: ActionHandler;
};

export function usePostOnboardingActionHandlers(): PostOnboardingActionHandlers {
  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "post-onboarding",
  });
  const dispatch = useDispatch();
  const navigation = useNavigation();

  return {
    [PostOnboardingActionId.assetsTransfer]: () => {
      handleOpenReceiveDrawer();
    },
    [PostOnboardingActionId.discoverWallet]: () => {
      dispatch(tickProductTourDeeplink());
      navigateToPortfolioWalletTab(navigation);
    },
  };
}
