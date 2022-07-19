/* @flow */
import invariant from "invariant";
import React from "react";
import { View, StyleSheet } from "react-native";
import type { AccountLike } from "@ledgerhq/live-common/types/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import { getAccountCapabilities } from "@ledgerhq/live-common/compound/logic";

import { useSelector } from "react-redux";
import LText from "../../components/LText";
import Alert from "../../components/Alert";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

type Props = {
  account: AccountLike,
};

const LendingBanners = ({ account }: Props) => {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const unit = getAccountUnit(account);

  invariant(account.type === "TokenAccount", "account must be a TokenAccount");

  const availableOnCompound = !!account.compoundBalance;
  const compoundCapabilities: any = availableOnCompound
    ? getAccountCapabilities(account)
    : {};

  let lendingInfoBanner = null;

  if (availableOnCompound && compoundCapabilities) {
    const lendingInfoBannerContent = !compoundCapabilities.status ? (
      <Trans i18nKey="transfer.lending.banners.needApproval" />
    ) : compoundCapabilities.enabledAmountIsUnlimited ? (
      <Trans i18nKey="transfer.lending.banners.fullyApproved" />
    ) : !!compoundCapabilities.status &&
      compoundCapabilities.enabledAmount.gt(0) &&
      compoundCapabilities.canSupplyMax ? (
      <Trans
        i18nKey="transfer.lending.banners.approvedCanReduce"
        values={{
          value: formatCurrencyUnit(unit, compoundCapabilities.enabledAmount, {
            locale,
            showAllDigits: false,
            disableRounding: true,
            showCode: true,
            discreet,
          }),
        }}
      >
        <LText semiBold />
      </Trans>
    ) : compoundCapabilities.enabledAmount.gt(0) ? (
      <Trans
        i18nKey="transfer.lending.banners.approvedButNotEnough"
        values={{
          value: formatCurrencyUnit(unit, compoundCapabilities.enabledAmount, {
            locale,
            showAllDigits: false,
            disableRounding: true,
            showCode: true,
            discreet,
          }),
        }}
      >
        <LText semiBold />
      </Trans>
    ) : null;

    if (lendingInfoBannerContent) {
      lendingInfoBanner = (
        <View style={styles.bannerBox} key="infoBanner">
          <Alert type="primary">{lendingInfoBannerContent}</Alert>
        </View>
      );
    }
  }

  let lendingWarningBanner = null;

  if (availableOnCompound && compoundCapabilities) {
    const lendingWarningBannerContent =
      compoundCapabilities.status === "ENABLING" ? (
        <Trans i18nKey="transfer.lending.banners.approving" />
      ) : !!compoundCapabilities.status &&
        !compoundCapabilities.canSupplyMax ? (
        <Trans i18nKey="transfer.lending.banners.notEnough" />
      ) : null;

    if (lendingWarningBannerContent) {
      lendingWarningBanner = (
        <View style={styles.bannerBox} key="warningBanner">
          <Alert type="warning">{lendingWarningBannerContent}</Alert>
        </View>
      );
    }
  }

  return [lendingInfoBanner, lendingWarningBanner];
}

const styles = StyleSheet.create({
  bannerBox: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
});

export default LendingBanners;
