import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, Flex } from "@ledgerhq/native-ui";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/core";
import React, { memo, useCallback } from "react";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import LText from "~/components/LText";
import Link from "~/components/wrappedUi/Link";
import { NavigatorName, ScreenName } from "~/const";

type EditOperationPanelProps = {
  isOperationStuck: boolean;
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  onPress?: () => void;
};

const EditOperationPanelComponent = ({
  isOperationStuck,
  operation,
  account,
  parentAccount,
  onPress,
}: EditOperationPanelProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { enabled: isEditBtcTxEnabled } = useFeature("editBitcoinTx") ?? {};
  const mainAccount = getMainAccount(account, parentAccount);
  const isBitcoin = mainAccount.currency.family === "bitcoin";

  const onLinkPress = useCallback(() => {
    onPress?.();

    if (account && isBitcoin) {
      navigation.navigate(NavigatorName.BitcoinEditTransaction, {
        screen: ScreenName.BitcoinEditTransactionMethodSelection,
        params: { operation, account, parentAccount },
      });
    }
  }, [account, parentAccount, operation, navigation, onPress, isBitcoin]);

  if (!isEditBtcTxEnabled || !isBitcoin) {
    return null;
  }

  return (
    <Flex
      backgroundColor={isOperationStuck ? colors.warning.c70 : colors.warning.c80}
      color="primary.c80"
      width="95%"
      alignSelf="center"
      alignContent="flex-end"
      borderRadius={8}
      padding={8}
    >
      <Box>
        <LText color={colors.neutral.c20}>
          {t(
            isOperationStuck
              ? "editTransaction.panel.stuckMessage"
              : "editTransaction.panel.speedupMessage",
          )}
        </LText>
        <LText marginTop={4}>
          <Link onPress={onLinkPress}>
            <LText
              color={colors.neutral.c20}
              style={{ textDecorationLine: "underline" }}
              marginTop={4}
            >
              {t("editTransaction.cta")}
            </LText>
          </Link>
        </LText>
      </Box>
    </Flex>
  );
};

export const EditOperationPanel = memo<EditOperationPanelProps>(EditOperationPanelComponent);
