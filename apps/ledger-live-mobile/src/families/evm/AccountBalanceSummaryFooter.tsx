import { STAKING_CONTRACTS } from "@ledgerhq/coin-evm/staking/index";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import {
  isStakingAccount,
  type StakingAccount,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { useFeature } from "@features/platform-feature-flags";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useTranslation } from "~/context/Locale";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";

type Props = { account: AccountLike };
type InfoName = "available" | "delegated" | "undelegating";

function AccountBalanceSummaryFooter({ account }: { account: StakingAccount }) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | undefined>();
  const info = useInfo(account);
  const unit = useAccountUnit(account);
  const { delegatedBalance, unbondingBalance } = account.stakingResources;

  const onCloseModal = useCallback(() => setInfoName(undefined), []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);

  const coinConfig = getCurrencyConfiguration(account.currency.id);
  const configurationDisableDelegation =
    "disableDelegation" in coinConfig && coinConfig.disableDelegation === true;

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
        {!configurationDisableDelegation && (
          <>
            {delegatedBalance.gt(0) && (
              <InfoItem
                title={t("account.delegatedAssets")}
                onPress={onPressInfoCreator("delegated")}
                value={<CurrencyUnitValue unit={unit} value={delegatedBalance} />}
                isLast={unbondingBalance.lte(0)}
              />
            )}
            {unbondingBalance.gt(0) && (
              <InfoItem
                title={t("account.undelegating")}
                onPress={onPressInfoCreator("undelegating")}
                value={<CurrencyUnitValue unit={unit} value={unbondingBalance} />}
                isLast={true}
              />
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  const { enabled, params } = useFeature("evmNativeStaking") ?? {};

  if (account.type !== "Account") return null;

  const isSupported =
    params?.supportedCurrencyIds?.some((id: string) => id === account.currency.id) ?? false;
  if (!enabled || !isSupported) return null;
  if (!isStakingAccount(account) || account.balance.lte(0)) return null;

  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfo(account: Account): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const stakingContract = STAKING_CONTRACTS[account.currency.id];
  const unbondingPeriodDays = stakingContract ? stakingContract.unbondingPeriodDays : undefined;
  return {
    available: [
      {
        Icon: () => <CurrencyIcon currency={account.currency} size={20} />,
        title: t("stake.ethereum.info.available.title", {
          currencyTicker: account.currency.ticker,
        }),
        description: t("stake.ethereum.info.available.description"),
      },
    ],
    delegated: [
      {
        title: t("stake.ethereum.info.delegated.title"),
        description: t("stake.ethereum.info.delegated.description", {
          currencyName: account.currency.name,
        }),
      },
    ],
    undelegating: [
      {
        title: t("stake.ethereum.info.undelegating.title"),
        description:
          unbondingPeriodDays !== undefined
            ? t("stake.ethereum.info.undelegating.description", {
                numberOfDays: unbondingPeriodDays,
              })
            : t("stake.default.info.undelegating.description"),
      },
    ],
  };
}
