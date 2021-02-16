// @flow

import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";

import type { Account } from "@ledgerhq/live-common/lib/types";

import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import InfoItem from "../../components/BalanceSummaryInfoItem";
import BondedIcon from "../../icons/LinkIcon";
import UnbondingIcon from "../../icons/Clock";
import Unbonded from "../../icons/Undelegate";

type Props = {
  account: Account,
};

type InfoName = "available" | "locked" | "unlocking" | "unlocked";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo();

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);

  const onPressInfoCreator = useCallback(
    (infoName: InfoName) => () => setInfoName(infoName),
    [],
  );

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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.root, { borderTopColor: colors.lightFog }]}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />

      <InfoItem
        title={t("account.availableBalance")}
        onPress={onPressInfoCreator("available")}
        value={
          <CurrencyUnitValue
            unit={unit}
            value={spendableBalance}
            disableRounding
          />
        }
      />
      {lockedBalance.gt(0) && (
        <InfoItem
          title={t("polkadot.lockedBalance")}
          onPress={onPressInfoCreator("locked")}
          value={
            <CurrencyUnitValue
              unit={unit}
              value={lockedBalance}
              disableRounding
            />
          }
        />
      )}
      {unlockingBalance.gt(0) && (
        <InfoItem
          title={t("polkadot.unlockingBalance")}
          onPress={onPressInfoCreator("unlocking")}
          value={
            <CurrencyUnitValue
              unit={unit}
              value={unlockingBalance}
              disableRounding
            />
          }
        />
      )}
      {unlockedBalance.gt(0) && (
        <InfoItem
          title={t("polkadot.unlockedBalance")}
          onPress={onPressInfoCreator("unlocked")}
          value={
            <CurrencyUnitValue
              unit={unit}
              value={unlockedBalance}
              disableRounding
            />
          }
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.polkadotResources || account.balance.lte(0)) return null;

  return <AccountBalanceSummaryFooter account={account} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,

    paddingTop: 16,
    overflow: "visible",
  },
});

function useInfo(): { [key: InfoName]: ModalInfo[] } {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("polkadot");
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
  };
}
