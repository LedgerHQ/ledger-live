import React from "react";
import { Flex, Button, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import {
  useWalletSyncAnalytics,
  AnalyticsButton,
  AnalyticsPage,
  AnalyticsFlow,
} from "LLM/features/WalletSync/hooks/useWalletSyncAnalytics";

type Props = {
  onPressSyncAccounts: () => void;
  onPressHasAlreadyCreatedAKey: () => void;
};

const Actions = ({ onPressSyncAccounts, onPressHasAlreadyCreatedAKey }: Props) => {
  const { t } = useTranslation();
  const { onClickTrack } = useWalletSyncAnalytics();

  const onPressSync = () => {
    onClickTrack({
      button: AnalyticsButton.SyncYourAccounts,
      page: AnalyticsPage.ActivateWalletSync,
      flow: AnalyticsFlow.WalletSync,
    });
    onPressSyncAccounts();
  };

  const onPressHasAlreadyAKey = () => {
    onClickTrack({
      button: AnalyticsButton.AlreadyCreatedKey,
      page: AnalyticsPage.ActivateWalletSync,
      flow: AnalyticsFlow.WalletSync,
    });
    onPressHasAlreadyCreatedAKey();
  };

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={32}>
      <Button
        type="main"
        alignSelf={"stretch"}
        minWidth={"100%"}
        size="large"
        onPress={onPressSync}
        accessibilityRole="button"
      >
        {t("walletSync.activation.screen.mainCta")}
      </Button>
      <Link size="large" onPress={onPressHasAlreadyAKey}>
        {t("walletSync.activation.screen.secondCta")}
      </Link>
    </Flex>
  );
};
export default Actions;
