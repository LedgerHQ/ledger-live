import { STAKING_CONTRACTS } from "@ledgerhq/coin-evm/staking/index";
import { isStakingAccount, StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { Account } from "@ledgerhq/types-live";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useTranslation } from "~/context/Locale";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";

type Props = {
  account: StakingAccount;
};
type InfoName = "available" | "delegated" | "undelegating" | "claimable";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo(account);
  const { spendableBalance, stakingResources } = account;
  const { delegatedBalance, unbondingBalance } = stakingResources;
  const unit = useAccountUnit(account);
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);

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
        style={[
          {
            paddingHorizontal: 16,
          },
        ]}
      >
        <InfoItem
          title={t("account.availableBalance")}
          onPress={onPressInfoCreator("available")}
          value={<CurrencyUnitValue unit={unit} value={spendableBalance} disableRounding />}
          isLast={
            configurationDisableDelegation || (delegatedBalance.lte(0) && unbondingBalance.lte(0))
          }
        />
        {!configurationDisableDelegation && (
          <>
            {delegatedBalance.gt(0) && (
              <InfoItem
                title={t("account.delegatedAssets")}
                onPress={onPressInfoCreator("delegated")}
                value={<CurrencyUnitValue unit={unit} value={delegatedBalance} disableRounding />}
                isLast={unbondingBalance.lte(0)}
              />
            )}
            {unbondingBalance.gt(0) && (
              <InfoItem
                title={t("account.undelegating")}
                onPress={onPressInfoCreator("undelegating")}
                value={<CurrencyUnitValue unit={unit} value={unbondingBalance} disableRounding />}
                isLast={true}
              />
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

type AccountBalanceFooterProps = {
  account: Account;
};

export default function AccountBalanceFooter({ account }: AccountBalanceFooterProps) {
  const featureFlagEnabled = useFeature("evmNativeStaking")?.enabled === true;
  if (!featureFlagEnabled) {
    return null;
  }

  if (!isStakingAccount(account)) {
    return null;
  }

  const { spendableBalance, stakingResources } = account;
  if (
    !stakingResources ||
    (spendableBalance.lte(0) &&
      stakingResources.delegatedBalance.lte(0) &&
      stakingResources.unbondingBalance.lte(0))
  ) {
    return null;
  }

  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfo(account: Account): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const stakingContract = STAKING_CONTRACTS[account.currency.id];
  const unbondingPeriodDays = stakingContract ? stakingContract.unbondingPeriodDays : undefined;
  return {
    available: [
      {
        Icon: () => (
          <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={20} />
        ),
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
    claimable: [
      {
        title: t("stake.ethereum.info.claimable.title"),
        description: t("stake.ethereum.info.claimable.description"),
      },
    ],
  };
}
