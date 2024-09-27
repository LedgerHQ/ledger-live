import React from "react";
import { Flex, Button, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import {
  useLedgerSyncAnalytics,
  AnalyticsButton,
  AnalyticsPage,
} from "LLM/features/WalletSync/hooks/useLedgerSyncAnalytics";

type Props = {
  onPressSyncAccounts: () => void;
  onPressHasAlreadyCreatedAKey: () => void;
  onPressLearnMore?: () => void;
};

const Actions = ({
  onPressSyncAccounts,
  onPressHasAlreadyCreatedAKey,
  onPressLearnMore,
}: Props) => {
  const { t } = useTranslation();
  const { onClickTrack } = useLedgerSyncAnalytics();

  const onPressSync = () => {
    onClickTrack({
      button: AnalyticsButton.SyncYourAccounts,
      page: AnalyticsPage.ActivateLedgerSync,
      hasFlow: true,
    });
    onPressSyncAccounts();
  };

  const onPressHasAlreadyAKey = () => {
    onClickTrack({
      button: AnalyticsButton.AlreadyCreatedKey,
      page: AnalyticsPage.ActivateLedgerSync,
      hasFlow: true,
    });
    onPressHasAlreadyCreatedAKey();
  };

  const onPressMore = () => {
    onClickTrack({
      button: AnalyticsButton.LearnMore,
      page: AnalyticsPage.ActivateLedgerSync,
      hasFlow: true,
    });
    onPressLearnMore?.();
  };

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={32}>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={16}>
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
        <Button
          type={"default"}
          border={"1px solid"}
          borderColor={"neutral.c50"}
          alignSelf={"stretch"}
          minWidth={"100%"}
          size="large"
          onPress={onPressHasAlreadyAKey}
          accessibilityRole="button"
        >
          {t("walletSync.activation.screen.secondCta")}
        </Button>
      </Flex>
      {onPressLearnMore && (
        <Link size="medium" onPress={onPressMore}>
          {t("walletSync.activation.screen.learnMore")}
        </Link>
      )}
    </Flex>
  );
};
export default Actions;
