import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type BigNumber from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import { useFeature } from "@features/platform-feature-flags";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import InfoModal from "~/modals/Info";
import type { ModalInfo } from "~/modals/Info";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type Props = Readonly<{
  account: TezosAccount | TokenAccount;
}>;

type InfoName = "available" | "delegated" | "staked" | "pending" | "withdrawable";

function TezosBalanceSummaryFooter({ account }: Readonly<{ account: TezosAccount }>) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const stakingEnabled = !!useFeature("llmTezosStaking")?.enabled;
  const {
    isDelegated,
    isStaked,
    stakedBalance,
    unstakedBalance,
    unstakedFinalizable,
    availableBalance,
  } = useTezosStakingInfo(account);
  const info = useInfo(account);

  const [infoName, setInfoName] = useState<InfoName | undefined>();
  const onCloseModal = useCallback(() => setInfoName(undefined), []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);

  const items = useMemo(() => {
    const list: { key: InfoName; title: string; value: BigNumber }[] = [
      { key: "available", title: t("account.availableBalance"), value: account.spendableBalance },
    ];
    if (isDelegated) {
      list.push({ key: "delegated", title: t("account.delegatedAssets"), value: availableBalance });
    }
    if (stakingEnabled && isStaked) {
      list.push({ key: "staked", title: t("tezos.account.stakedAssets"), value: stakedBalance });
    }
    if (stakingEnabled && unstakedBalance.gt(0)) {
      list.push({
        key: "pending",
        title: t("tezos.account.pendingWithdrawable"),
        value: unstakedBalance,
      });
    }
    if (stakingEnabled && unstakedFinalizable.gt(0)) {
      list.push({
        key: "withdrawable",
        title: t("tezos.account.withdrawableAssets"),
        value: unstakedFinalizable,
      });
    }
    return list;
  }, [
    t,
    account.spendableBalance,
    isDelegated,
    availableBalance,
    stakingEnabled,
    isStaked,
    stakedBalance,
    unstakedBalance,
    unstakedFinalizable,
  ]);

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
      {items.map((item, i) => (
        <InfoItem
          key={item.key}
          title={item.title}
          onPress={onPressInfoCreator(item.key)}
          value={<CurrencyUnitValue unit={unit} value={item.value} disableRounding />}
          isLast={i === items.length - 1}
        />
      ))}
    </ScrollView>
  );
}

export default function AccountBalanceSummaryFooter({ account }: Props) {
  if (account.type !== "Account" || account.balance.lte(0)) return null;
  return <TezosBalanceSummaryFooter account={account} />;
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

function useInfo(account: TezosAccount): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const Icon = () => (
    <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={20} />
  );
  return {
    available: [
      {
        Icon,
        title: t("account.availableBalance"),
        description: t("tezos.account.availableBalanceTooltip"),
      },
    ],
    delegated: [
      {
        Icon,
        title: t("account.delegatedAssets"),
        description: t("tezos.account.delegatedAssetsTooltip"),
      },
    ],
    staked: [
      {
        Icon,
        title: t("tezos.account.stakedAssets"),
        description: t("tezos.account.stakedAssetsTooltip"),
      },
    ],
    pending: [
      {
        Icon,
        title: t("tezos.account.pendingWithdrawable"),
        description: t("tezos.account.pendingWithdrawableTooltip"),
      },
    ],
    withdrawable: [
      {
        Icon,
        title: t("tezos.account.withdrawableAssets"),
        description: t("tezos.account.withdrawableAssetsTooltip"),
      },
    ],
  };
}
