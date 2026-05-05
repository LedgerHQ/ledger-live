import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Account } from "@ledgerhq/types-live";
import {
  isStakingAccount,
  type StakingAccount,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import InfoModal from "~/modals/Info";
import type { ModalInfo } from "~/modals/Info";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type Props = { account: Account };
type InfoName = "available" | "delegated";

function AccountBalanceSummaryFooter({ account }: { account: StakingAccount }) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | undefined>();
  const unit = useAccountUnit(account);
  const { delegatedBalance } = account.stakingResources;

  const onCloseModal = useCallback(() => setInfoName(undefined), []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);

  const info: Record<InfoName, ModalInfo[]> = {
    available: [
      {
        title: t("evm.info.available.title", { currencyTicker: account.currency.ticker }),
        description: t("evm.info.available.description"),
      },
    ],
    delegated: [
      {
        title: t("evm.info.delegated.title"),
        description: t("evm.info.delegated.description", {
          currencyName: account.currency.name,
        }),
      },
    ],
  };

  if (!delegatedBalance.gt(0)) return null;

  return (
    <>
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16 }}
      >
        <InfoItem
          title={t("account.availableBalance")}
          onPress={onPressInfoCreator("available")}
          value={<CurrencyUnitValue unit={unit} value={account.spendableBalance} />}
        />
        <InfoItem
          title={t("account.delegatedAssets")}
          onPress={onPressInfoCreator("delegated")}
          value={<CurrencyUnitValue unit={unit} value={delegatedBalance} />}
          isLast
        />
      </ScrollView>
    </>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  const { enabled, params } = useFeature("evmNativeStaking") ?? {};
  const isSupported = params?.supportedCurrencyIds?.some(id => id === account.currency.id) ?? false;

  if (account.type !== "Account") return null;
  if (!enabled || !isSupported) return null;
  if (!isStakingAccount(account) || account.balance.lte(0)) return null;

  return <AccountBalanceSummaryFooter account={account} />;
}
