import React from "react";
import { Linking, View } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { useSolanaPreloadData } from "@ledgerhq/live-common/families/solana/react";
import { SolanaAccount, SolanaOperation } from "@ledgerhq/live-common/families/solana/types";
import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";

export const openAddressUrl = (currency: CryptoCurrency, address: string) => () => {
  const url = getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) {
    Linking.openURL(url);
  }
};

function useFormatAmount() {
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  return (unit: Unit, amount: BigNumber) => {
    return formatCurrencyUnit(unit, amount, formatConfig);
  };
}

type WithdrawExtraFieldsProps = {
  account: SolanaAccount;
  fromAddress: string;
  amount: BigNumber;
};

const WithdrawExtraFields = ({ account, fromAddress, amount }: WithdrawExtraFieldsProps) => {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const formatAmount = useFormatAmount();

  return (
    <View>
      <Section title={t("operationDetails.extra.withdrawnFrom")} value={fromAddress} />
      <Section
        title={t("operationDetails.extra.withdrawnAmount")}
        value={formatAmount(unit, amount)}
      />
    </View>
  );
};

type DelegateExtraFieldsProps = {
  account: SolanaAccount;
  voteAddress: string;
  amount: BigNumber;
};

const DelegateExtraFields = ({ account, voteAddress, amount }: DelegateExtraFieldsProps) => {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const formatAmount = useFormatAmount();
  const preloadData = useSolanaPreloadData(account.currency);
  const validator = preloadData?.validators.find(v => v.voteAccount === voteAddress);
  const nameOrAddress = validator ? validator.name : voteAddress;

  return (
    <View>
      <Section
        title={t("operationDetails.extra.delegatedTo")}
        value={nameOrAddress}
        onPress={() => openAddressUrl(account.currency, voteAddress)}
      />
      <Section
        title={t("operationDetails.extra.delegatedAmount")}
        value={formatAmount(unit, amount)}
      />
    </View>
  );
};

const OperationDetailsStake = ({ account, operation, type }: SolanaOperationDetailsExtraProps) => {
  if (!operation.extra.stake) return null;
  const { address, amount } = operation.extra.stake;
  switch (type) {
    case "DELEGATE": {
      return <DelegateExtraFields account={account} voteAddress={address} amount={amount} />;
    }
    case "WITHDRAW_UNBONDED": {
      return <WithdrawExtraFields account={account} fromAddress={address} amount={amount} />;
    }
    default:
      return null;
  }
};

const OperationDetailsMemo = ({ memo }: { memo: string }) => {
  const { t } = useTranslation();
  return <Section title={t("operationDetails.extra.memo")} value={memo} />;
};

type SolanaOperationDetailsExtraProps = {
  operation: SolanaOperation;
  type: OperationType;
  account: SolanaAccount;
};

const OperationDetailsExtra = ({ type, account, operation }: SolanaOperationDetailsExtraProps) => {
  return (
    <>
      {!!operation.extra.memo && <OperationDetailsMemo memo={operation.extra.memo} />}
      <OperationDetailsStake type={type} account={account} operation={operation} />
    </>
  );
};

export default {
  OperationDetailsExtra,
};
