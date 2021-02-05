// @flow
import isAfter from "date-fns/isAfter";

import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Polkadot as PolkadotIdenticon } from "@polkadot/reactnative-identicon/icons";

import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import type { Account } from "@ledgerhq/live-common/lib/types";
import {
  canNominate,
  isStash,
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/lib/families/polkadot/logic";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/lib/families/polkadot/react";
import type { PolkadotNomination } from "@ledgerhq/live-common/lib/families/polkadot/types";

import { ScreenName, NavigatorName } from "../../../const";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import IlluRewards from "../../../icons/images/Rewards";
import { urls } from "../../../config/urls";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import WarningBox from "../../../components/WarningBox";

import CollapsibleList from "../components/CollapsibleList";
import NominationDrawer from "../components/NominationDrawer";
import { NominateAction, RebondAction } from "./Actions";
import { getDrawerInfo } from "./drawerInfo";
import NominationRow from "./NominationRow";
import UnlockingRow from "./UnlockingRow";
import {
  ExternalControllerUnsupportedWarning,
  ExternalStashUnsupportedWarning,
} from "./UnsupportedWarning";

type Props = {
  account: Account,
};

export default function Nominations({ account }: Props) {
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account);

  const navigation = useNavigation();

  const { staking, validators } = usePolkadotPreloadData();

  const { polkadotResources } = mainAccount;

  const { lockedBalance, unlockedBalance, nominations, unlockings } =
    polkadotResources || {};

  const [nomination, setNomination] = useState<?PolkadotNomination>();

  const mappedNominations = useMemo(() => {
    const all =
      nominations?.map(nomination => {
        const validator = validators.find(
          v => v.address === nomination.address,
        );
        return {
          nomination,
          validator,
        };
      }) || [];

    return all.reduce(
      (sections, mapped) => {
        if (mapped.nomination.status === "active") {
          sections.uncollapsed.push(mapped);
        } else {
          sections.collapsed.push(mapped);
        }
        return sections;
      },
      { uncollapsed: [], collapsed: [] },
    );
  }, [nominations, validators]);

  const mappedNomination = useMemo(() => {
    if (nomination) {
      const validator = validators.find(v => v.address === nomination.address);
      return {
        nomination,
        validator,
      };
    }
    return null;
  }, [nomination, validators]);

  const mappedUnlockings = useMemo(() => {
    const now = new Date(Date.now());
    const withoutUnlocked =
      unlockings?.filter(({ completionDate }) =>
        isAfter(completionDate, now),
      ) ?? [];

    const [firstRow, ...otherRows] =
      unlockedBalance && unlockedBalance.gt(0)
        ? [{ amount: unlockedBalance, completionDate: now }, ...withoutUnlocked]
        : withoutUnlocked;

    return { uncollapsed: firstRow ? [firstRow] : [], collapsed: otherRows };
  }, [unlockings, unlockedBalance]);

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: $Values<typeof NavigatorName> | $Values<typeof ScreenName>,
      screen?: $Values<typeof ScreenName>,
      params?: { [key: string]: any },
    }) => {
      setNomination();
      navigation.navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onEarnRewards = useCallback(() => {
    isStash(account)
      ? onNavigate({
          route: NavigatorName.PolkadotNominateFlow,
          screen: ScreenName.PolkadotNominateSelectValidators,
        })
      : onNavigate({
          route: NavigatorName.PolkadotBondFlow,
          screen: ScreenName.PolkadotBondStarted,
        });
  }, [account, onNavigate]);

  const onNominate = useCallback(() => {
    onNavigate({
      route: NavigatorName.PolkadotNominateFlow,
      screen: ScreenName.PolkadotNominateSelectValidators,
    });
  }, [onNavigate]);

  const onRebond = useCallback(() => {
    onNavigate({
      route: NavigatorName.PolkadotRebondFlow,
      screen: ScreenName.PolkadotRebondAmount,
    });
  }, [onNavigate]);

  const onWithdraw = useCallback(() => {
    onNavigate({
      route: NavigatorName.PolkadotSimpleOperationFlow,
      screen: ScreenName.PolkadotSimpleOperationStarted,
      params: {
        mode: "withdrawUnbonded",
      },
    });
  }, [onNavigate]);

  const onCloseDrawer = useCallback(() => {
    setNomination();
  }, []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const onLearnMore = useCallback(() => {
    Linking.openURL(urls.polkadotStaking);
  }, []);

  const drawerInfo = useMemo(
    () =>
      mappedNomination
        ? getDrawerInfo({
            t,
            account,
            onOpenExplorer,
            nomination: mappedNomination?.nomination,
            validator: mappedNomination?.validator,
          })
        : [],
    [mappedNomination, t, account, onOpenExplorer],
  );

  const electionOpen =
    staking?.electionClosed !== undefined ? !staking?.electionClosed : false;

  const hasBondedBalance = lockedBalance && lockedBalance.gt(0);
  const hasUnlockedBalance = unlockedBalance && unlockedBalance.gt(0);
  const hasNominations = nominations && nominations?.length > 0;
  const hasUnlockings = unlockings && unlockings.length > 0;
  const hasPendingBondOperation = hasPendingOperationType(account, "BOND");
  const hasPendingWithdrawUnbondedOperation = hasPendingOperationType(
    account,
    "WITHDRAW_UNBONDED",
  );

  const nominateEnabled = !electionOpen && canNominate(account);
  const rebondEnabled = !electionOpen && !!hasUnlockings;
  const withdrawEnabled =
    !electionOpen && hasUnlockedBalance && !hasPendingWithdrawUnbondedOperation;
  const earnRewardsEnabled =
    !electionOpen && !hasBondedBalance && !hasPendingBondOperation;

  const renderNomination = useCallback(
    ({ nomination, validator }, i, isLast) => (
      <View key={nomination.address}>
        <NominationRow
          nomination={nomination}
          validator={validator}
          account={account}
          onPress={() => setNomination(nomination)}
          isLast={isLast}
        />
      </View>
    ),
    [account],
  );

  const renderShowInactiveNominations = useCallback(
    collapsed =>
      collapsed
        ? t("polkadot.nomination.showInactiveNominations", {
            count: mappedNominations.collapsed.length,
          })
        : t("polkadot.nomination.hideInactiveNominations"),
    [t, mappedNominations],
  );

  const renderUnlocking = useCallback(
    (unlocking, i, isLast) => (
      <View key={`unlocking_${i}`}>
        <UnlockingRow
          amount={unlocking.amount}
          completionDate={unlocking.completionDate}
          account={account}
          onWithdraw={onWithdraw}
          disabled={!withdrawEnabled}
          isLast={isLast}
        />
      </View>
    ),
    [account, onWithdraw, withdrawEnabled],
  );

  const renderShowAllUnlockings = useCallback(
    collapsed =>
      collapsed
        ? t("polkadot.nomination.showAllUnlockings", {
            count: mappedUnlockings.collapsed.length,
          })
        : t("polkadot.nomination.hideAllUnlockings"),
    [t, mappedUnlockings],
  );

  if (hasExternalController(account)) {
    return (
      <ExternalControllerUnsupportedWarning
        address={polkadotResources?.controller}
        onOpenExplorer={onOpenExplorer}
        onLearnMore={onLearnMore}
      />
    );
  }
  if (hasExternalStash(account)) {
    return (
      <ExternalStashUnsupportedWarning
        address={polkadotResources?.stash}
        onOpenExplorer={onOpenExplorer}
        onLearnMore={onLearnMore}
      />
    );
  }

  return (
    <View style={styles.root}>
      <NominationDrawer
        isOpen={drawerInfo && drawerInfo.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) =>
          mappedNomination?.nomination.address ? (
            <PolkadotIdenticon
              address={mappedNomination?.nomination.address}
              size={size}
            />
          ) : null
        }
        data={drawerInfo}
        isNominated
      />
      {electionOpen && (
        <WarningBox>{t("polkadot.info.electionOpen.description")}</WarningBox>
      )}
      {!hasBondedBalance && hasPendingBondOperation && (
        <WarningBox>
          {t("polkadot.nomination.hasPendingBondOperation")}
        </WarningBox>
      )}
      {!hasNominations ? (
        <AccountDelegationInfo
          title={t("polkadot.nomination.emptyState.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("polkadot.nomination.emptyState.description", {
            name: account.currency.name,
          })}
          infoUrl={urls.polkadotStaking}
          infoTitle={t("polkadot.nomination.emptyState.info")}
          onPress={onEarnRewards}
          disabled={!(earnRewardsEnabled || nominateEnabled)}
          ctaTitle={
            !hasBondedBalance && !hasPendingBondOperation
              ? t("polkadot.nomination.emptyState.cta")
              : t("polkadot.nomination.nominate")
          }
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("polkadot.nomination.header")}
            RightComponent={
              <NominateAction
                disabled={!nominateEnabled}
                electionOpen={electionOpen}
                onPress={onNominate}
              />
            }
          />
          <CollapsibleList
            uncollapsedItems={mappedNominations.uncollapsed}
            collapsedItems={mappedNominations.collapsed}
            renderItem={renderNomination}
            renderShowMore={renderShowInactiveNominations}
          >
            {!mappedNominations.uncollapsed.length && (
              <WarningBox onLearnMore={onLearnMore}>
                {t("polkadot.nomination.noActiveNominations")}
              </WarningBox>
            )}
          </CollapsibleList>
        </View>
      )}

      {hasUnlockings ? (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("polkadot.unlockings.header")}
            RightComponent={
              <RebondAction disabled={!rebondEnabled} onPress={onRebond} />
            }
          />
          <CollapsibleList
            uncollapsedItems={mappedUnlockings.uncollapsed}
            collapsedItems={mappedUnlockings.collapsed}
            renderItem={renderUnlocking}
            renderShowMore={renderShowAllUnlockings}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    margin: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  wrapper: {
    marginBottom: 16,
  },
});
