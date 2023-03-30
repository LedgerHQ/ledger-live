// @flow

import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { AvalanchePChainAccount } from "@ledgerhq/live-common/families/avalanchepchain/types";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import InfoItem from "../../components/BalanceSummaryInfoItem";

type Props = {
  account: Account;
};

type InfoName = "available" | "delegated";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo();

  const { spendableBalance, avalanchePChainResources } =
    account as AvalanchePChainAccount;
  const { stakedBalance } = avalanchePChainResources || {};

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
      style={[styles.root, { paddingHorizontal: 16 }]}
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
      {stakedBalance.gt(0) && (
        <InfoItem
          title={t("account.delegatedAssets")}
          onPress={onPressInfoCreator("delegated")}
          value={
            <CurrencyUnitValue
              unit={unit}
              value={stakedBalance}
              disableRounding
            />
          }
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (
    !(account as AvalanchePChainAccount).avalanchePChainResources ||
    account.balance.lte(0)
  )
    return null;

  return <AccountBalanceSummaryFooter account={account} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    overflow: "visible",
    paddingTop: 16,
  },
});

function useInfo(): { [key: InfoName]: ModalInfo[] } {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("avalanchepchain");
  const AvalancheIcon = getCryptoCurrencyIcon(currency);
  invariant(AvalancheIcon, "Icon is expected");

  return {
    available: [
      {
        Icon: () => <AvalancheIcon color={currency.color} size={18} />,
        title: t("avalanchepchain.info.available.title"),
        description: t("avalanchepchain.info.available.description"),
      },
    ],
    delegated: [
      {
        Icon: () => <AvalancheIcon color={currency.color} size={18} />,
        title: t("avalanchepchain.info.delegated.title"),
        description: t("avalanchepchain.info.delegated.description"),
      },
    ],
  };
}
