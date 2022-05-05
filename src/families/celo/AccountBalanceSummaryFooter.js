// @flow

import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";

import type { Account } from "@ledgerhq/live-common/lib/types";

import invariant from "invariant";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import InfoItem from "../../components/BalanceSummaryInfoItem";

type Props = {
  account: Account,
};

type InfoName = "available";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo();

  const { spendableBalance } = account;

  const unit = getAccountUnit(account);

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);

  const onPressInfoCreator = useCallback(
    (infoName: InfoName) => () => setInfoName(infoName),
    [],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.root]}
      contentContainerStyle={{ paddingHorizontal: 16 }}
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
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (account.balance.lte(0)) return null;

  return <AccountBalanceSummaryFooter account={account} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    paddingTop: 16,
    overflow: "visible",
  },
});

function useInfo(): { [key: InfoName]: ModalInfo[] } {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("celo");
  const CeloIcon = getCryptoCurrencyIcon(currency);
  invariant(CeloIcon, "Icon is expected");

  return {
    available: [
      {
        Icon: () => <CeloIcon color={currency.color} size={18} />,
        title: t("celo.info.available.title"),
        description: t("celo.info.available.description"),
      },
    ],
  };
}
