// @flow

import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/data/cryptocurrencies";
import type { Account } from "@ledgerhq/live-common/lib/types";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import {
  // prettier-ignore
  // $FlowFixMe
  SectionList,
  withNavigation,
  SafeAreaView,
} from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import colors from "../../colors";
import AccountCard from "../../components/AccountCard";
import Button from "../../components/Button";
import Circle from "../../components/Circle";
import LText from "../../components/LText";
import StepHeader from "../../components/StepHeader";
import IconExclamationCircle from "../../icons/ExclamationCircle";
import LiveLogo from "../../icons/LiveLogoIcon";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import {
  accountsSelector,
  migratableAccountsSelector,
} from "../../reducers/accounts";

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  migratableAccounts: migratableAccountsSelector,
  currencyIds: state =>
    migratableAccountsSelector(state)
      .reduce(
        (c, a) => (c.includes(a.currency.id) ? c : [...c, a.currency.id]),
        [],
      )
      .sort(),
});

type Props = {
  navigation: NavigationScreenProp<*>,
  currencyIds: string[],
  migratableAccounts: Account[],
};

const forceInset = { bottom: "always" };

const Overview = ({ navigation, migratableAccounts, currencyIds }: Props) => {
  const showNotice = navigation.getParam("showNotice");
  const startMigration = useCallback(() => {
    navigation.navigate("MigrateAccountsConnectDevice", {
      currency: getCryptoCurrencyById(currencyIds[0]),
    });
  }, [navigation, currencyIds]);

  const renderSectionHeader = ({ section }: { section: * }) => (
    <LText style={styles.currencyTitle} semiBold>
      <Trans
        i18nKey="migrateAccounts.overview.currency"
        count={section.data.length}
        values={{
          currency: section.data[0].currency.name,
          accounts: section.data.length,
        }}
      />
    </LText>
  );

  const renderItem = ({ item }: { item: * }) => (
    <View style={styles.cardWrapper}>
      <AccountCard account={item} parentAccount={null} style={styles.card} />
    </View>
  );

  return (
    <SafeAreaView
      forceInset={forceInset}
      style={[styles.root, { paddingTop: extraStatusBarPadding }]}
    >
      <Circle bg={colors.pillActiveBackground} size={56}>
        {showNotice ? (
          <IconExclamationCircle color={colors.live} size={24} />
        ) : (
          <LiveLogo color={colors.live} size={24} />
        )}
      </Circle>
      <LText style={styles.title} semiBold>
        <Trans i18nKey="migrateAccounts.overview.title" />
      </LText>
      <LText style={styles.subtitle}>
        <Trans
          i18nKey={`migrateAccounts.overview.${
            showNotice ? "notice" : "subtitle"
          }`}
          values={{ accountCount: migratableAccounts.length }}
        />
      </LText>
      <SectionList
        stickySectionHeadersEnabled
        style={styles.body}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={account => account.id}
        sections={currencyIds.map(currencyId => ({
          currencyId,
          data: migratableAccounts.filter(a => a.currency.id === currencyId),
        }))}
      />

      <View style={styles.buttonWrapper}>
        <Button
          event="StartOrContinueMigration"
          type="primary"
          title={
            <Trans
              i18nKey={`migrateAccounts.overview.${
                showNotice ? "continue" : "start"
              }`}
            />
          }
          onPress={startMigration}
        />
      </View>
    </SafeAreaView>
  );
};

Overview.navigationOptions = () => ({
  headerTitle: (
    <StepHeader
      title={<Trans i18nKey="migrateAccounts.overview.headerTitle" />}
      subtitle={
        <Trans
          i18nKey="send.stepperHeader.stepRange"
          values={{
            currentStep: "1",
            totalSteps: "3",
          }}
        />
      }
    />
  ),
});
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  currencyList: {
    marginHorizontal: 8,
    flex: 1,
  },
  title: {
    marginHorizontal: 20,
    marginTop: 16,
    color: colors.darkBlue,
    fontSize: 16,
    marginBottom: 8,
  },
  start: {},
  subtitle: {
    marginHorizontal: 20,
    marginBottom: 24,
    color: colors.smoke,
    fontSize: 14,
    textAlign: "center",
  },
  currencyTitle: {
    backgroundColor: colors.white,
    color: colors.smoke,
    paddingTop: 24,
    paddingBottom: 16,
  },
  buttonWrapper: {
    padding: 16,
    width: "100%",
  },
  cardWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  card: {
    paddingHorizontal: 8,
    backgroundColor: colors.lightGrey,
  },
  body: {
    paddingHorizontal: 12,
    flex: 1,
    width: "100%",
  },
});

export default connect(mapStateToProps)(withNavigation(Overview));
