import React from "react";
import { useTranslation } from "react-i18next";
import { SideImageCard } from "@ledgerhq/native-ui";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/core";
import SectionContainer from "../../../screens/WalletCentricSections/SectionContainer";

import { NavigatorName, ScreenName } from "../../../const";

type EditOperationCardProps = {
  oldestEditableOperation: Operation;
  isOperationStuck: boolean;
  account: AccountLike | undefined;
  parentAccount: Account | null | undefined;
  onEditTransactionPress?: (operation: Operation) => void;
};

export const EditOperationCard = ({
  oldestEditableOperation,
  isOperationStuck,
  onEditTransactionPress,
  account,
  parentAccount,
}: EditOperationCardProps) => {
  const { t } = useTranslation();
  const flag = useFeature("editEthTx");
  const navigation = useNavigation();

  return flag?.enabled ? (
    <SectionContainer px={6}>
      <SideImageCard
        title={t(
          isOperationStuck
            ? "editTransaction.panel.stuckMessage"
            : "editTransaction.panel.speedupMessage",
        )}
        cta={t("editTransaction.cta")}
        onPress={() => {
          if (account) {
            navigation.navigate(NavigatorName.EditTransaction, {
              screen: ScreenName.EditTransactionMethodSelection,
              params: {
                operation: oldestEditableOperation,
                account,
                parentAccount,
              },
            });
          }

          onEditTransactionPress &&
            onEditTransactionPress(oldestEditableOperation);
        }}
      />
    </SectionContainer>
  ) : null;
};
