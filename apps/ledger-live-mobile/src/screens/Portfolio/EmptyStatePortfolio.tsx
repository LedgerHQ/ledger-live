import React, { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { hasInstalledAnyAppSelector } from "~/reducers/settings";
import { NavigatorName } from "~/const";
import Button from "~/components/Button";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import noAccountsImgDark from "~/images/illustration/Dark/_048.png";
import noAccountsImgLight from "~/images/illustration/Light/_048.png";
import noAppsImgDark from "~/images/illustration/Dark/_056.png";
import noAppsImgLight from "~/images/illustration/Light/_056.png";
import HelpLink from "~/components/HelpLink";
import { urls } from "~/utils/urls";
import Illustration from "~/images/illustration/Illustration";
import { BaseNavigation, BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { MainNavigatorParamList } from "~/components/RootNavigator/types/MainNavigator";

type Props = {
  showHelp?: boolean;
};

type NavigationProp = BaseNavigationComposite<StackNavigationProp<MainNavigatorParamList>>;

function EmptyStatePortfolio({ showHelp = true }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const hasInstalledAnyApp = useSelector(hasInstalledAnyAppSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);

  const openAddModal = useCallback(() => setAddModalOpened(true), [setAddModalOpened]);

  const closeAddModal = useCallback(() => setAddModalOpened(false), [setAddModalOpened]);

  const navigateToManager = useCallback(() => {
    navigation.navigate(NavigatorName.Manager);
  }, [navigation]);

  const [darkSource, lightSource] = hasInstalledAnyApp
    ? [noAccountsImgDark, noAccountsImgLight]
    : [noAppsImgDark, noAppsImgLight];

  return (
    <>
      {showHelp ? (
        <Flex alignSelf="flex-end" mx={6}>
          <HelpLink url={hasInstalledAnyApp ? urls.addAccount : urls.goToManager} color="grey" />
        </Flex>
      ) : null}
      <Flex flex={1} flexDirection="column" justifyContent="center" bg="background.main">
        <Box alignItems="center" mt={8}>
          <Illustration size={150} darkSource={darkSource} lightSource={lightSource} />
          <Text variant="body" fontWeight="bold" mt={9} mb={4}>
            <Trans
              i18nKey={`portfolio.emptyState.${
                hasInstalledAnyApp ? "noAccountsTitle" : "noAppsTitle"
              }`}
            />
          </Text>
          <Text variant="body" mb={8} textAlign="center" color="neutral.c80">
            <Trans
              i18nKey={`portfolio.emptyState.${
                hasInstalledAnyApp ? "noAccountsDesc" : "noAppsDesc"
              }`}
            />
          </Text>

          <Flex alignSelf="stretch" flexDirection="column">
            {hasInstalledAnyApp ? (
              <>
                <Button
                  event="PortfolioEmptyToImport"
                  type={"main"}
                  outline={false}
                  title={<Trans i18nKey="portfolio.emptyState.buttons.import" />}
                  onPress={openAddModal}
                  containerStyle={{ marginBottom: 16 }}
                />
                <Button
                  event="PortfolioEmptyToManager"
                  type={"main"}
                  title={<Trans i18nKey="portfolio.emptyState.buttons.managerSecondary" />}
                  onPress={navigateToManager}
                />
              </>
            ) : (
              <Button
                event="PortfolioEmptyToManager"
                type={"main"}
                title={<Trans i18nKey="portfolio.emptyState.buttons.manager" />}
                onPress={navigateToManager}
              />
            )}
          </Flex>
          <AddAccountsModal
            navigation={navigation as unknown as BaseNavigation}
            isOpened={isAddModalOpened}
            onClose={closeAddModal}
          />
        </Box>
      </Flex>
    </>
  );
}

export default memo<Props>(EmptyStatePortfolio);
