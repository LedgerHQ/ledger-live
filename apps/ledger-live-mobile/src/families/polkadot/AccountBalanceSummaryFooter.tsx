import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { useTheme } from "@react-navigation/native";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import { hasMinimumBondBalance } from "@ledgerhq/live-common/families/polkadot/logic";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import BondedIcon from "~/icons/LinkIcon";
import UnbondingIcon from "~/icons/Clock";
import Unbonded from "~/icons/Undelegate";
import WarningIcon from "~/icons/Warning";

type Props = {
  account: PolkadotAccount;
};
type InfoName = "available" | "locked" | "unlocking" | "unlocked" | "minBondWarning";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo(account);
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);
  const { spendableBalance, polkadotResources } = account;
  const {
    lockedBalance: _lockedBalance,
    unlockingBalance: _unlockingBalance,
    unlockedBalance,
  } = polkadotResources || {};
  const unit = getAccountUnit(account);

  // NOTE: All balances are including the next one...
  // So we exclude each other for better understanding and ensure sum of all balances
  // is equal to the total balance.
  // Exclude the unlocking part from the locked balance
  const lockedBalance = _lockedBalance.minus(_unlockingBalance);

  const unlockingBalance = _unlockingBalance.minus(unlockedBalance);

  const hasMinBondBalance = hasMinimumBondBalance(account);
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
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
      >
        <InfoItem
          title={t("account.availableBalance")}
          onPress={onPressInfoCreator("available")}
          value={<CurrencyUnitValue unit={unit} value={spendableBalance} disableRounding />}
          isLast={!unlockingBalance.gt(0) && !lockedBalance.gt(0) && !unlockedBalance.gt(0)}
        />
        {lockedBalance.gt(0) && (
          <InfoItem
            warning={!hasMinBondBalance}
            title={t("polkadot.lockedBalance")}
            onPress={onPressInfoCreator(hasMinBondBalance ? "locked" : "minBondWarning")}
            value={<CurrencyUnitValue unit={unit} value={lockedBalance} disableRounding />}
            isLast={!unlockingBalance.gt(0) && !unlockedBalance.gt(0)}
          />
        )}
        {unlockingBalance.gt(0) && (
          <InfoItem
            title={t("polkadot.unlockingBalance")}
            onPress={onPressInfoCreator("unlocking")}
            value={<CurrencyUnitValue unit={unit} value={unlockingBalance} disableRounding />}
            isLast={!unlockedBalance.gt(0)}
          />
        )}
        {unlockedBalance.gt(0) && (
          <InfoItem
            title={t("polkadot.unlockedBalance")}
            onPress={onPressInfoCreator("unlocked")}
            value={<CurrencyUnitValue unit={unit} value={unlockedBalance} disableRounding />}
            isLast={true}
          />
        )}
      </ScrollView>
    </>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.polkadotResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfo(account: PolkadotAccount): Record<InfoName, ModalInfo[]> {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const preloaded = usePolkadotPreloadData();
  const minimumBondBalance = new BigNumber(preloaded.minimumBondBalance);
  const unit = getAccountUnit(account);
  const minimumBondBalanceStr = formatCurrencyUnit(unit, minimumBondBalance, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet: false,
  });

  const { currency } = account;
  const PolkadotIcon = getCryptoCurrencyIcon(currency);
  invariant(PolkadotIcon, "Icon is expected");

  return {
    available: [
      {
        Icon: () => <PolkadotIcon color={currency.color} size={18} />,
        title: t("polkadot.info.available.title"),
        description: t("polkadot.info.available.description"),
      },
    ],
    locked: [
      {
        Icon: () => <BondedIcon color={colors.darkBlue} size={18} />,
        title: t("polkadot.info.locked.title"),
        description: t("polkadot.info.locked.description"),
      },
    ],
    unlocking: [
      {
        Icon: () => <UnbondingIcon color={colors.darkBlue} size={18} />,
        title: t("polkadot.info.unlocking.title"),
        description: t("polkadot.info.unlocking.description"),
      },
    ],
    unlocked: [
      {
        Icon: () => <Unbonded color={colors.darkBlue} size={18} />,
        title: t("polkadot.info.unlocked.title"),
        description: t("polkadot.info.unlocked.description"),
      },
    ],
    minBondWarning: [
      {
        Icon: () => <WarningIcon color={colors.orange} size={18} />,
        title: t("polkadot.info.notEnoughBonded"),
        description: t("polkadot.bondedBalanceBelowMinimum", {
          minimumBondBalance: minimumBondBalanceStr,
        }),
      },
    ],
  };
}
