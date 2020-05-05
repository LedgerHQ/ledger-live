/* @flow */
import React, { useCallback, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import EthereumGasLimit from "./SendRowGasLimit";
import ExternalLink from "../../icons/ExternalLink";
import Info from "../../icons/Info";
import { urls } from "../../config/urls";
import colors from "../../colors";
import { ScreenName } from "../../const";
import BottomModal from "../../components/BottomModal";
import TokenNetworkFeeInfo from "./TokenNetworkFeeInfo";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  navigation: any,
};

export default function EthereumFeeRow({
  account,
  parentAccount,
  transaction,
  navigation,
}: Props) {
  const { t } = useTranslation();
  const [isNetworkFeeHelpOpened, setNetworkFeeHelpOpened] = useState(false);
  const toggleNetworkFeeHelpModal = useCallback(
    () => setNetworkFeeHelpOpened(!isNetworkFeeHelpOpened),
    [isNetworkFeeHelpOpened],
  );
  const closeNetworkFeeHelpModal = () => setNetworkFeeHelpOpened(false);

  const extraInfoFees = useCallback(() => {
    closeNetworkFeeHelpModal();
    Linking.openURL(urls.feesEthereum);
  }, []);

  const openFees = useCallback(() => {
    navigation.navigate(ScreenName.EthereumEditFee, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [navigation, account, parentAccount, transaction]);

  const mainAccount = getMainAccount(account, parentAccount);
  const {
    gasPrice,
    userGasLimit: gasLimit,
    estimatedGasLimit,
    feeCustomUnit,
  } = transaction;

  const InfoIcon = account.type === "TokenAccount" ? Info : ExternalLink;
  return (
    <>
      <BottomModal
        id="TokenNetworkFee"
        isOpened={isNetworkFeeHelpOpened}
        preventBackdropClick={false}
        onClose={closeNetworkFeeHelpModal}
      >
        <TokenNetworkFeeInfo
          gotoExtraInfo={extraInfoFees}
          onClose={closeNetworkFeeHelpModal}
        />
      </BottomModal>

      <SummaryRow
        onPress={
          account.type === "TokenAccount"
            ? toggleNetworkFeeHelpModal
            : extraInfoFees
        }
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <View>
            <InfoIcon size={12} color={colors.grey} />
          </View>
        }
      >
        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.accountContainer}>
            {gasPrice ? (
              <LText style={styles.valueText}>
                <CurrencyUnitValue
                  unit={feeCustomUnit || mainAccount.unit}
                  value={gasPrice}
                />
              </LText>
            ) : null}

            <LText style={styles.link} onPress={openFees}>
              {t("common.edit")}
            </LText>
          </View>
          <LText style={styles.countervalue}>
            <CounterValue
              before="≈ "
              value={
                gasPrice && gasPrice.times(gasLimit || estimatedGasLimit || 0)
              }
              currency={mainAccount.currency}
            />
          </LText>
        </View>
      </SummaryRow>
      <EthereumGasLimit
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
    color: colors.darkBlue,
  },
  countervalue: {
    fontSize: 12,
    color: colors.grey,
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
});
