import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useSelector } from "~/context/hooks";
import { ScreenName } from "~/const";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { formatDepositAmount } from "./utils/formatDepositAmount";

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

export type PerpsReviewParams = Readonly<PerpsDepositReviewParams>;

export type PerpsReviewProps = PerpsReviewParams &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
  }>;

export type PerpsReviewViewModel = Readonly<{
  drawerOpen: boolean;
  swapDetails: readonly PerpsReviewDetailItem[];
  depositDetails: readonly PerpsReviewDetailItem[];
  handleDrawerClose: () => void;
  handleDeposit: () => void;
}>;

export function usePerpsReviewViewModel({
  isOpen,
  onClose,
  amountSent,
  amountTo,
  depositAccount,
  receiverAccount,
  quoteId,
}: PerpsReviewProps): PerpsReviewViewModel {
  const walletState = useSelector(walletSelector);
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const formattedAmountSent = useMemo(
    () => formatDepositAmount(amountSent, depositAccount),
    [amountSent, depositAccount],
  );

  const formattedAmountReceived = useMemo(
    () => formatDepositAmount(amountTo, receiverAccount),
    [amountTo, receiverAccount],
  );

  const receiverAccountLabel = useMemo(
    () => accountNameWithDefaultSelector(walletState, receiverAccount),
    [receiverAccount, walletState],
  );

  const swapDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.amountSendLabel",
        value: formattedAmountSent,
        testID: "perps-deposit-amount-sent",
      },
      {
        labelKey: "perpsReview.amountReceiveLabel",
        value: formattedAmountReceived,
        testID: "perps-deposit-amount-received",
      },
    ],
    [formattedAmountReceived, formattedAmountSent],
  );

  const depositDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.depositAmountLabel",
        value: formattedAmountReceived,
        testID: "perps-deposit-deposited-amount",
      },
      {
        labelKey: "perpsReview.depositReceiveLabel",
        value: receiverAccountLabel,
        testID: "perps-deposit-receiver-account",
      },
    ],
    [formattedAmountReceived, receiverAccountLabel],
  );

  const handleDeposit = useCallback(() => {
    onClose();
    navigation.navigate(ScreenName.PerpsDepositSign, {
      depositAccount,
      receiverAccount,
      amountSent,
      amountTo,
      quoteId,
    });
  }, [amountTo, amountSent, depositAccount, navigation, onClose, quoteId, receiverAccount]);

  return {
    drawerOpen: isOpen,
    swapDetails,
    depositDetails,
    handleDrawerClose: onClose,
    handleDeposit,
  };
}
