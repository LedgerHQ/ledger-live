import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/core";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";

import LText from "../../../components/LText";
import Link from "../../../components/wrappedUi/Link";
import { NavigatorName, ScreenName } from "../../../const";

type EditOperationPanelProps = {
  isOperationStuck: boolean;
  operation: Operation;
  account: AccountLike | null | undefined;
  parentAccount: Account | null | undefined;
  onEditTxPress?: () => void;
};

export const EditOperationPanel = ({
  isOperationStuck,
  operation,
  account,
  parentAccount,
  onEditTxPress,
}: EditOperationPanelProps) => {
  const { t } = useTranslation();
  const flag = useFeature("editEthTx");
  const navigation = useNavigation();

  return flag?.enabled ? (
    <Flex
      backgroundColor={isOperationStuck ? "warning.c70" : "primary.c80"}
      color={"primary.c80"}
      width="95%"
      alignSelf={"center"}
      alignContent={"flex-end"}
      borderRadius={8}
      padding={8}
    >
      {isOperationStuck ? (
        <Box>
          <LText color="neutral.c20">
            {t("editTransaction.panel.stuckMessage")}
          </LText>
          <LText marginTop={4}>
            <Link
              onPress={() => {
                onEditTxPress && onEditTxPress();

                if (account) {
                  navigation.navigate(NavigatorName.EditTransaction, {
                    screen: ScreenName.EditTransactionMethodSelection,
                    params: { operation, account, parentAccount },
                  });
                }
              }}
            >
              <LText
                color="neutral.c20"
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
            <LText color="neutral.c20">
              {t("editTransaction.panel.speedupMessage")}
            </LText>
            <LText marginTop={4}>
              <Link
                onPress={() => {
                  onEditTxPress && onEditTxPress();

                  if (account) {
                    navigation.navigate(NavigatorName.EditTransaction, {
                      screen: ScreenName.EditTransactionMethodSelection,
                      params: { operation, account, parentAccount },
                    });
                  }
                }}
              >
                <LText
                  color="neutral.c20"
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
