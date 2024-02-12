import isAfter from "date-fns/isAfter";

import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import {
  canNominate,
  isStash,
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";
import type {
  PolkadotAccount,
  PolkadotNomination,
  PolkadotUnlocking,
  PolkadotValidator,
} from "@ledgerhq/live-common/families/polkadot/types";

import { Box, Flex } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import { StackNavigationProp } from "@react-navigation/stack";
import { ScreenName, NavigatorName } from "~/const";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import { urls } from "~/utils/urls";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Alert from "~/components/Alert";

import CollapsibleList from "../components/CollapsibleList";
import NominationDrawer from "../components/NominationDrawer";
import { NominateAction, RebondAction, SetControllerAction } from "./Actions";
import { getDrawerInfo } from "./drawerInfo";
import NominationRow from "./NominationRow";
import UnlockingRow from "./UnlockingRow";
import {
  ExternalControllerUnsupportedWarning,
  ExternalStashUnsupportedWarning,
} from "./UnsupportedWarning";
import Illustration from "~/images/illustration/Illustration";
import EarnLight from "~/images/illustration/Light/_003.png";
import EarnDark from "~/images/illustration/Dark/_003.png";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  account: AccountLike;
};

type Section = {
  nomination: PolkadotNomination;
  validator: PolkadotValidator | undefined;
};

export default function Nominations(props: Props) {
  const { account } = props as { account: PolkadotAccount };
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account) as PolkadotAccount;

  const navigation = useNavigation();

  const { staking, validators } = usePolkadotPreloadData();

  const { polkadotResources } = mainAccount;

  const { lockedBalance, unlockedBalance, nominations, unlockings } = polkadotResources || {};

  const [nomination, setNomination] = useState<PolkadotNomination>();

  const mappedNominations = useMemo(() => {
    const all =
      nominations?.map(nomination => {
        const validator = validators.find(validator => validator.address === nomination.address);
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
      {
        uncollapsed: [] as Section[],
        collapsed: [] as Section[],
      },
    );
  }, [nominations, validators]);

  const mappedNomination = useMemo(() => {
    if (nomination) {
      const validator = validators.find(validator => validator.address === nomination.address);
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
      unlockings?.filter(({ completionDate }) => isAfter(completionDate, now)) ?? [];

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
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      setNomination(undefined);
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(route, {
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

  const onSetController = useCallback(() => {
    onNavigate({
      route: NavigatorName.PolkadotSimpleOperationFlow,
      screen: ScreenName.PolkadotSimpleOperationStarted,
      params: {
        mode: "setController",
      },
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
    setNomination(undefined);
  }, []);

  const onOpenExplorer = useCallback(
    (address?: string | null) => {
      const url = address && getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

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

  const electionOpen = staking?.electionClosed !== undefined ? !staking?.electionClosed : false;

  const hasBondedBalance = lockedBalance && lockedBalance.gt(0);
  const hasUnlockedBalance = unlockedBalance && unlockedBalance.gt(0);
  const hasNominations = nominations && nominations?.length > 0;
  const hasUnlockings = unlockings && unlockings.length > 0;
  const hasPendingBondOperation = hasPendingOperationType(account, "BOND");
  const hasPendingWithdrawUnbondedOperation = hasPendingOperationType(account, "WITHDRAW_UNBONDED");

  const nominateEnabled = !electionOpen && canNominate(account);
  const rebondEnabled = !electionOpen && !!hasUnlockings;
  const withdrawEnabled =
    !electionOpen && hasUnlockedBalance && !hasPendingWithdrawUnbondedOperation;
  const earnRewardsEnabled = !electionOpen && !hasBondedBalance && !hasPendingBondOperation;

  const renderNomination = useCallback(
    ({ nomination, validator }: Section, i: number, isLast: boolean) => (
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
    (collapsed: boolean) =>
      collapsed
        ? t("polkadot.nomination.showInactiveNominations", {
            count: mappedNominations.collapsed.length,
          })
        : t("polkadot.nomination.hideInactiveNominations"),
    [t, mappedNominations],
  );

  const renderUnlocking = useCallback(
    (unlocking: PolkadotUnlocking, i: number, isLast: boolean) => (
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
    (collapsed: boolean) =>
      collapsed
        ? t("polkadot.nomination.showAllUnlockings", {
            count: mappedUnlockings.collapsed.length,
          })
        : t("polkadot.nomination.hideAllUnlockings"),
    [t, mappedUnlockings],
  );

  if (hasExternalController(account)) {
    return (
      <View style={styles.root}>
        <AccountSectionLabel
          name={t("polkadot.nomination.header")}
          RightComponent={
            <SetControllerAction
              disabled={electionOpen}
              electionOpen={electionOpen}
              onPress={onSetController}
            />
          }
        />
        <ExternalControllerUnsupportedWarning
          address={polkadotResources?.controller}
          onOpenExplorer={onOpenExplorer}
        />
      </View>
    );
  }
  if (hasExternalStash(account)) {
    return (
      <View style={styles.root}>
        <AccountSectionLabel name={t("polkadot.nomination.header")} />
        <ExternalStashUnsupportedWarning
          address={polkadotResources?.stash}
          onOpenExplorer={onOpenExplorer}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NominationDrawer
        isOpen={drawerInfo && drawerInfo.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={() => (
          <FirstLetterIcon label={mappedNomination?.validator?.identity || "-"} />
        )}
        data={drawerInfo}
        isNominated
      />
      {electionOpen && <Alert type="warning">{t("polkadot.info.electionOpen.description")}</Alert>}
      {!hasBondedBalance && hasPendingBondOperation && (
        <Alert type="warning">{t("polkadot.nomination.hasPendingBondOperation")}</Alert>
      )}
      {!hasNominations ? (
        <AccountDelegationInfo
          title={t("polkadot.nomination.emptyState.title")}
          image={
            <Flex alignItems="center" mb={6}>
              <Illustration lightSource={EarnLight} darkSource={EarnDark} size={150} />
            </Flex>
          }
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
        <Box>
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
              <Alert type="warning" learnMoreUrl={urls.polkadotStaking}>
                {t("polkadot.nomination.noActiveNominations")}
              </Alert>
            )}
          </CollapsibleList>
        </Box>
      )}

      {hasUnlockings ? (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("polkadot.unlockings.header")}
            RightComponent={<RebondAction disabled={!rebondEnabled} onPress={onRebond} />}
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
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  wrapper: {
    marginBottom: 16,
  },
});
