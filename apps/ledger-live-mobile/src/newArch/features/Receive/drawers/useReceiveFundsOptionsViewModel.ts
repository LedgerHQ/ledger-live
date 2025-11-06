import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { isCryptoOrTokenCurrency } from "LLM/utils/isCryptoOrTokenCurrency";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useReceiveOptionsDrawerController } from "../useReceiveOptionsDrawerController";

// Fiat provider manifest ID for Noah integration
const FIAT_PROVIDER_MANIFEST_ID = "noah";

function useReceiveFundsOptionsViewModel() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { currency, sourceScreenName, fromMenu, isOpen, closeDrawer } =
    useReceiveOptionsDrawerController();

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency: isCryptoOrTokenCurrency(currency) ? currency : undefined,
    sourceScreenName: sourceScreenName,
    fromMenu: fromMenu,
  });

  const handleClose = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const handleGoToFiat = useCallback(() => {
    handleClose();
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: {
        manifestId: FIAT_PROVIDER_MANIFEST_ID,
        fromMenu: true,
      },
    });
  }, [navigation, handleClose]);

  const handleGoToCrypto = useCallback(() => {
    handleClose();
    handleOpenReceiveDrawer(true);
  }, [handleOpenReceiveDrawer, handleClose]);

  return {
    t,
    handleGoToFiat,
    handleGoToCrypto,
    handleClose,
    isOpen,
  };
}

export default useReceiveFundsOptionsViewModel;
