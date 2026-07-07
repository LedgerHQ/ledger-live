import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { ScreenName } from "~/const";
import type {
  CustomSendFlow,
  CustomSendFlowScreen,
} from "~/screens/SendFunds/utils/customSendFlow";
import { BalanceSelectionScreen, BalanceSelectionHeaderTitle } from "./Send/BalanceSelectionScreen";
import { MandatoryPrivateSyncScreen } from "./Send/MandatoryPrivateSyncScreen";

const screens: CustomSendFlowScreen[] = [
  {
    name: ScreenName.AleoSendBalanceSelection,
    component: BalanceSelectionScreen,
    options: { headerTitle: BalanceSelectionHeaderTitle },
  },
  {
    name: ScreenName.AleoMandatoryPrivateSync,
    component: MandatoryPrivateSyncScreen,
    options: { headerShown: false },
  },
];

const aleoSendFlow = {
  screens,
  buildSendEntrypoint: ({ account, parentAccount }) => ({
    screen: ScreenName.AleoSendBalanceSelection,
    params: { account, parentAccount, isSelfTransfer: false },
  }),
  navigateToInitialScreen: ({ navigation, account, parentAccount, extra }) => {
    navigation.navigate(ScreenName.AleoSendBalanceSelection, {
      account,
      parentAccount,
      isSelfTransfer: extra?.isSelfTransfer === true,
    });
  },
  navigateAfterRecipient: ({ navigation, account, parentAccount, transaction }) => {
    if (transaction.family === "aleo" && isPrivateTransaction(transaction)) {
      navigation.navigate(ScreenName.AleoMandatoryPrivateSync, {
        account,
        parentAccount,
        transaction,
      });
      return true;
    }

    return false;
  },
} satisfies CustomSendFlow;

export default aleoSendFlow;
