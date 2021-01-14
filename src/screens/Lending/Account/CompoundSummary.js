// @flow

import React, { useState, useCallback, useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";

import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { listCurrentRates } from "@ledgerhq/live-common/lib/families/ethereum/modules/compound";

import { findCompoundToken } from "@ledgerhq/live-common/lib/currencies";
import { useTheme } from "@react-navigation/native";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import InfoItem from "../../../components/BalanceSummaryInfoItem";
import InfoModal from "../../../modals/Info";

type Props = {
  account: Account,
  compoundSummary: CompoundAccountSummary,
};

type InfoName =
  | "amountSupplied"
  | "currencyAPY"
  | "accruedInterests"
  | "interestEarned";

export default function AccountBalanceSummaryFooter({
  account,
  compoundSummary,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const unit = getAccountUnit(account);
  const { accruedInterests, totalSupplied, allTimeEarned } = compoundSummary;
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);

  const onPressInfoCreator = (infoName: InfoName) => () =>
    setInfoName(infoName);

  const rates = listCurrentRates();
  const ctoken = findCompoundToken(account.token);

  const rate = rates.find(r => r.ctoken.id === ctoken.id);

  const infoCandidates = useMemo(
    () => ({
      amountSupplied: [
        {
          title: t("transfer.lending.account.amountSupplied"),
          description: t("transfer.lending.account.amountSuppliedTooltip"),
        },
      ],
      currencyAPY: [
        {
          title: t("transfer.lending.account.currencyAPY"),
          description: t("transfer.lending.account.currencyAPYTooltip"),
        },
      ],
      accruedInterests: [
        {
          title: t("transfer.lending.account.accruedInterests"),
          description: t("transfer.lending.account.accruedInterestsTooltip"),
        },
      ],
      interestEarned: [
        {
          title: t("transfer.lending.account.interestEarned"),
          description: t("transfer.lending.account.interestEarnedTooltip"),
        },
      ],
    }),
    [t],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.root, { borderTopColor: colors.lightFog }]}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? infoCandidates[infoName] : []}
      />
      <InfoItem
        title={t("transfer.lending.account.amountSupplied")}
        value={
          <CurrencyUnitValue
            unit={unit}
            value={totalSupplied}
            disableRounding
          />
        }
        onPress={onPressInfoCreator("amountSupplied")}
      />
      <InfoItem
        title={t("transfer.lending.account.currencyAPY")}
        value={rate?.supplyAPY || "-"}
        onPress={onPressInfoCreator("currencyAPY")}
      />
      <InfoItem
        title={t("transfer.lending.account.accruedInterests")}
        value={
          <CurrencyUnitValue
            unit={unit}
            value={accruedInterests}
            disableRounding
          />
        }
        onPress={onPressInfoCreator("accruedInterests")}
      />
      <InfoItem
        title={t("transfer.lending.account.interestEarned")}
        value={
          <CurrencyUnitValue
            unit={unit}
            value={allTimeEarned}
            disableRounding
          />
        }
        onPress={onPressInfoCreator("interestEarned")}
      />
    </ScrollView>
  );
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
