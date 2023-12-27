import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { SideImageCard } from "@ledgerhq/native-ui";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/core";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { NavigatorName, ScreenName } from "~/const";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";

type EditOperationCardProps = {
  oldestEditableOperation: Operation;
  isOperationStuck: boolean;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  onPress?: (operation: Operation) => void;
};

export const EditOperationCard = ({
  oldestEditableOperation,
  isOperationStuck,
  onPress,
  account,
  parentAccount,
}: EditOperationCardProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};
  const mainAccount = getMainAccount(account, parentAccount);
  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId) || false;

  const onEditTransactionCardPress = useCallback(() => {
    navigation.navigate(NavigatorName.EvmEditTransaction, {
      screen: ScreenName.EvmEditTransactionMethodSelection,
      params: {
        operation: oldestEditableOperation,
        account,
        parentAccount,
      },
    });
  }, [account, oldestEditableOperation, parentAccount, navigation]);

  if (!isEditEvmTxEnabled || !isCurrencySupported) {
    return null;
  }

  return (
    <SectionContainer px={6}>
      <SideImageCard
        title={t(
          isOperationStuck
            ? "editTransaction.panel.stuckMessage"
            : "editTransaction.panel.speedupMessage",
        )}
        cta={t("editTransaction.cta")}
        onPress={() => {
          onEditTransactionCardPress();
          onPress && onPress(oldestEditableOperation);
        }}
      />
    </SectionContainer>
  );
};
