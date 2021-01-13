/* @flow */
import React, { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { View, StyleSheet, Image } from "react-native";
import { hasInstalledAnyAppSelector } from "../../reducers/settings";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import Button from "../../components/Button";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import noAccountsImg from "../../images/noAccounts.png";
import noAppsImg from "../../images/noApps.png";
import HelpLink from "../../components/HelpLink";
import { urls } from "../../config/urls";

type Props = {
  navigation: any,
  showHelp?: boolean,
};

function EmptyStatePortfolio({ navigation, showHelp = true }: Props) {
  const hasInstalledAnyApp = useSelector(hasInstalledAnyAppSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);

  const openAddModal = useCallback(() => setAddModalOpened(true), [
    setAddModalOpened,
  ]);

  const closeAddModal = useCallback(() => setAddModalOpened(false), [
    setAddModalOpened,
  ]);

  const navigateToManager = useCallback(
    () => navigation.navigate(ScreenName.Manager),
    [navigation],
  );

  return (
    <>
      {showHelp ? (
        <View style={styles.help}>
          <HelpLink
            url={hasInstalledAnyApp ? urls.addAccount : urls.goToManager}
            color="grey"
          />
        </View>
      ) : null}
      <View style={styles.root}>
        <View style={styles.body}>
          <Image source={hasInstalledAnyApp ? noAccountsImg : noAppsImg} />
          <LText secondary bold style={styles.title}>
            <Trans
              i18nKey={`portfolio.emptyState.${
                hasInstalledAnyApp ? "noAccountsTitle" : "noAppsTitle"
              }`}
            />
          </LText>
          <LText secondary style={styles.desc} color="grey">
            <Trans
              i18nKey={`portfolio.emptyState.${
                hasInstalledAnyApp ? "noAccountsDesc" : "noAppsDesc"
              }`}
            />
          </LText>

          <View style={styles.containerCTA}>
            {hasInstalledAnyApp ? (
              <>
                <Button
                  event="PortfolioEmptyToImport"
                  type={"primary"}
                  title={
                    <Trans i18nKey="portfolio.emptyState.buttons.import" />
                  }
                  onPress={openAddModal}
                  containerStyle={[styles.primaryCTA]}
                />
                <Button
                  event="PortfolioEmptyToManager"
                  type={"lightSecondary"}
                  title={
                    <Trans i18nKey="portfolio.emptyState.buttons.managerSecondary" />
                  }
                  onPress={navigateToManager}
                />
              </>
            ) : (
              <Button
                event="PortfolioEmptyToManager"
                type={"primary"}
                title={<Trans i18nKey="portfolio.emptyState.buttons.manager" />}
                onPress={navigateToManager}
              />
            )}
          </View>
          <AddAccountsModal
            navigation={navigation}
            isOpened={isAddModalOpened}
            onClose={closeAddModal}
          />
        </View>
      </View>
    </>
  );
}

export default memo<Props>(EmptyStatePortfolio);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
  },

  help: {
    margin: 16,
    marginBottom: 0,
    alignSelf: "flex-end",
  },

  body: {
    alignItems: "center",
  },
  primaryCTA: {
    marginBottom: 16,
  },

  title: {
    marginTop: 40,
    marginBottom: 12,
    fontSize: 18,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 40,
  },
  containerCTA: {
    alignSelf: "stretch",
    flexDirection: "column",
  },
});
