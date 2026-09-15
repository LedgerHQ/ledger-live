import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  useTotalMaturity,
  useTotalStaked,
  useTotalStakedMaturity,
} from "@ledgerhq/live-common/families/internet_computer/react";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import type { AccountLike } from "@ledgerhq/types-live";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useTranslation } from "~/context/Locale";
import InfoModal, { type ModalInfo } from "~/modals/Info";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

// Deliberately `AccountLike` rather than `ICPAccount`: the account page intersects every family's
// footer prop type and casts one account through it, so demanding ICP's required `neurons` field here
// would break every other family's call.
type Props = Readonly<{
  account: AccountLike;
}>;

type InfoName = "available" | "stakedBalance" | "totalMaturity";

function ICPBalanceSummaryFooter({ account }: Readonly<{ account: ICPAccount }>) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const totalStaked = useTotalStaked(account);
  const liquidMaturity = useTotalMaturity(account);
  // Maturity already staked into a neuron is excluded from `neuronStake`, so it appears in neither
  // the staked total nor the liquid one. Summing both here is what makes the figure the "total
  // maturity" its description promises, rather than silently hiding the staked share.
  const stakedMaturity = useTotalStakedMaturity(account);
  const totalMaturity = liquidMaturity.plus(stakedMaturity);

  const info = useInfo(account);
  const [infoName, setInfoName] = useState<InfoName | undefined>();
  const onCloseModal = useCallback(() => setInfoName(undefined), []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);

  // Leads with the available balance, as every other staking family's footer does. Three unrounded
  // magnitude-8 values overflow the screen, which the horizontal ScrollView is there to absorb.
  const items = useMemo(
    () => [
      {
        key: "available" as const,
        title: t("account.availableBalance"),
        value: account.spendableBalance,
      },
      {
        key: "stakedBalance" as const,
        title: t("internetComputer.summaryFooter.stakedBalance"),
        value: totalStaked,
      },
      {
        key: "totalMaturity" as const,
        title: t("internetComputer.summaryFooter.totalMaturity"),
        value: totalMaturity,
      },
    ],
    [t, account.spendableBalance, totalMaturity, totalStaked],
  );

  if (totalStaked.isZero() && totalMaturity.isZero()) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      {items.map((item, index) => (
        <InfoItem
          key={item.key}
          title={item.title}
          onPress={onPressInfoCreator(item.key)}
          value={<CurrencyUnitValue unit={unit} value={item.value} disableRounding />}
          isLast={index === items.length - 1}
        />
      ))}
    </ScrollView>
  );
}

export default function AccountBalanceSummaryFooter({ account }: Props) {
  if (account.type !== "Account") return null;
  return <ICPBalanceSummaryFooter account={account as ICPAccount} />;
}

function useInfo(account: ICPAccount): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const Icon = () => (
    <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={20} />
  );
  return {
    available: [
      {
        Icon,
        title: t("account.availableBalance"),
        description: t("internetComputer.summaryFooter.availableBalanceTooltip"),
      },
    ],
    stakedBalance: [
      {
        Icon,
        title: t("internetComputer.summaryFooter.stakedBalance"),
        description: t("internetComputer.summaryFooter.stakedBalanceTooltip"),
      },
    ],
    totalMaturity: [
      {
        Icon,
        title: t("internetComputer.summaryFooter.totalMaturity"),
        description: t("internetComputer.summaryFooter.totalMaturityTooltip"),
      },
    ],
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    overflow: "visible",
  },
  content: {
    paddingHorizontal: 16,
  },
});
