import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CompositeScreenProps } from "@react-navigation/native";
import { getFeesCurrency, getFeesUnit } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  Transaction as AleoTransaction,
  TransactionStatus as AleoTransactionStatus,
} from "@ledgerhq/live-common/families/aleo/types";
import type { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "~/context/Locale";
import Alert from "~/components/Alert";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SectionSeparator from "~/components/SectionSeparator";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import SummaryTotalSection from "~/screens/SendFunds/SummaryTotalSection";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  status?: TransactionStatusCommon;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function AleoSendRowsFee({ account, parentAccount, transaction, status }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const aleoTransaction = transaction as AleoTransaction;
  const aleoStatus = status as AleoTransactionStatus | undefined;
  const fees = aleoStatus?.estimatedFees ?? aleoTransaction.fees;
  const totalSpent = aleoStatus?.totalSpent ?? aleoTransaction.amount.plus(fees);
  const currency = getFeesCurrency(account);
  const unit = getFeesUnit(currency);
  const isSponsored = fees.isZero();
  const learnMoreUrl = useLocalizedUrl(urls.aleo.learnMore);

  return (
    <>
      <SectionSeparator lineColor={colors.lightFog} />
      <SummaryRow title={<Trans i18nKey="send.fees.title" />}>
        {isSponsored ? (
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            {t("aleo.shared.sponsoredByProvable")}
          </Text>
        ) : (
          <Box lx={amountContainerStyle}>
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              <CurrencyUnitValue unit={unit} value={fees} />
            </Text>
            <Text typography="body3" lx={{ color: "muted" }}>
              <CounterValue before="≈ " value={fees} currency={currency} />
            </Text>
          </Box>
        )}
      </SummaryRow>
      <SectionSeparator lineColor={colors.lightFog} />
      <SummaryTotalSection account={account} parentAccount={parentAccount} amount={totalSpent} />
      <Alert
        type="secondary"
        title={t("aleo.send.summary.proofGenerationNotice")}
        learnMoreUrl={learnMoreUrl}
      />
    </>
  );
}

const amountContainerStyle: LumenViewStyle = {
  alignItems: "flex-end",
};
