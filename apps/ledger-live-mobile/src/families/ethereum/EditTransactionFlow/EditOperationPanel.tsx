import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/core";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useTheme } from "styled-components/native";

import LText from "../../../components/LText";
import Link from "../../../components/wrappedUi/Link";
import { NavigatorName, ScreenName } from "../../../const";

type EditOperationPanelProps = {
  isOperationStuck: boolean;
  operation: Operation;
  account: AccountLike | null | undefined;
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
  const flag = useFeature("editEthTx");
  const navigation = useNavigation();
  const { colors } = useTheme();

  const onLinkPress = useCallback(() => {
    onPress && onPress();

    if (account) {
      navigation.navigate(NavigatorName.EditTransaction, {
        screen: ScreenName.EditTransactionMethodSelection,
        params: { operation, account, parentAccount },
      });
    }
  }, [account, parentAccount, operation, navigation, onPress]);

  return flag?.enabled ? (
    <Flex
      backgroundColor={isOperationStuck ? colors.warning.c70 : colors.warning.c80}
      color={"primary.c80"}
      width="95%"
      alignSelf={"center"}
      alignContent={"flex-end"}
      borderRadius={8}
      padding={8}
    >
      {isOperationStuck ? (
        <Box>
          <LText color={colors.neutral.c20}>{t("editTransaction.panel.stuckMessage")}</LText>
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
      ) : (
        <>
          <Box>
            <LText color={colors.neutral.c20}>{t("editTransaction.panel.speedupMessage")}</LText>
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
        </>
      )}
    </Flex>
  ) : null;
};

export const EditOperationPanel = memo<EditOperationPanelProps>(EditOperationPanelComponent);
