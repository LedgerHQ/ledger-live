import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListRenderItemInfo, Linking, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { Box, Button, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import {
  useAlreadyOnboardedURI,
  usePostOnboardingURI,
  useHomeURI,
} from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useRefreshAccountsOrdering } from "~/actions/general";
import {
  // TODO: discreetMode is never used 😱 is it safe to remove
  // discreetModeSelector,
  hasBeenUpsoldProtectSelector,
  lastConnectedDeviceSelector,
  onboardingTypeSelector,
} from "~/reducers/settings";
import { setHasBeenUpsoldProtect } from "~/actions/settings";
import Carousel from "~/components/Carousel";
import { ScreenName } from "~/const";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import RecoverBanner from "~/components/RecoverBanner";
import PortfolioEmptyState from "./PortfolioEmptyState";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import AllocationsSection from "../WalletCentricSections/Allocations";
import { track } from "~/analytics";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import PortfolioOperationsHistorySection from "./PortfolioOperationsHistorySection";
import PortfolioGraphCard from "./PortfolioGraphCard";
import {
  hasNonTokenAccountsSelector,
  hasTokenAccountsNotBlacklistedSelector,
  hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
} from "~/reducers/accounts";
import PortfolioAssets from "./PortfolioAssets";
import { internetReachable } from "~/logic/internetReachable";
import { UpdateStep } from "../FirmwareUpdate";
import { OnboardingType } from "~/reducers/types";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useSettings } from "~/hooks";

export { default as PortfolioTabIcon } from "./TabIcon";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(CollapsibleHeaderFlatList, {
  progressViewOffset: Platform.OS === "android" ? 64 : 0,
});

function PortfolioScreen({ navigation }: NavigationProps) {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { t } = useTranslation();
  // TODO: discreetMode is never used 😱 is it safe to remove
  // const discreetMode = useSelector(discreetModeSelector);
  const hasBeenUpsoldProtect = useSelector(hasBeenUpsoldProtectSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
  const { isAWalletCardDisplayed } = useDynamicContent();
  const onboardingType = useSelector(onboardingTypeSelector);
  const protectFeature = useFeature("protectServicesMobile");
  const recoverAlreadyOnboardedURI = useAlreadyOnboardedURI(protectFeature);
  const recoverPostOnboardingURI = usePostOnboardingURI(protectFeature);
  const recoverHomeURI = useHomeURI(protectFeature);
  const dispatch = useDispatch();

  const onBackFromUpdate = useCallback(
    (_updateState: UpdateStep) => {
      navigation.goBack();
    },
    [navigation],
  );

  useEffect(() => {
    const openProtectUpsell = async () => {
      const internetConnected = await internetReachable();
      if (internetConnected && protectFeature?.enabled) {
        if (recoverPostOnboardingURI && onboardingType === OnboardingType.restore) {
          Linking.openURL(recoverPostOnboardingURI);
        } else if (recoverHomeURI && onboardingType === OnboardingType.setupNew) {
          Linking.openURL(recoverHomeURI);
        } else if (recoverAlreadyOnboardedURI) {
          Linking.openURL(recoverAlreadyOnboardedURI);
        }
      }
    };
    if (!hasBeenUpsoldProtect && lastConnectedDevice?.modelId === "nanoX") {
      openProtectUpsell();
      dispatch(setHasBeenUpsoldProtect(true));
    }
  }, [
    onboardingType,
    hasBeenUpsoldProtect,
    lastConnectedDevice,
    recoverPostOnboardingURI,
    recoverAlreadyOnboardedURI,
    recoverHomeURI,
    dispatch,
    protectFeature?.enabled,
  ]);

  usePortfolioAnalyticsOptInPrompt();

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, [setAddModalOpened]);

  const closeAddModal = useCallback(() => setAddModalOpened(false), [setAddModalOpened]);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const hasTokenAccounts = useSelector(hasTokenAccountsNotBlacklistedSelector);
  const hasNonTokenAccounts = useSelector(hasNonTokenAccountsSelector);
  const hasTokenAccountsWithPositiveBalance = useSelector(
    hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
  );

  const showAssets =
    hasNonTokenAccounts || // always show accounts even if they are empty
    hasTokenAccountsWithPositiveBalance || // always show token accounts if they are not empty
    (!hideEmptyTokenAccount && hasTokenAccounts); // conditionally show empty token accounts

  const { language } = useSettings();
  const mappedLanguage: {
    [k: string]: string;
  } = {
    de: "de-DE",
    el: "el-GR",
    en: "en-US",
    es: "es-ES",
    fi: "fi-FI",
    fr: "fr-FR",
    hu: "hu-HU",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    nl: "nl-NL",
    no: "no-NO",
    pl: "pl-PL",
    pt: "pt-BR",
    ru: "ru-RU",
    sr: "sr-SR",
    sv: "sv-SV",
    tr: "tr-TR",
    zh: "zh-CN",
    ar: "ar-EG",
  };
  const trueLocale = mappedLanguage[language] || "en-US";
  const data = useMemo(
    () => [
      <WalletTabSafeAreaView key="portfolioHeaderElements" edges={["left", "right"]}>
        <Flex px={6} key="FirmwareUpdateBanner">
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
        <PortfolioGraphCard showAssets={showAssets} key="PortfolioGraphCard" />
        {showAssets ? (
          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
            mt={7}
          />
        ) : null}
      </WalletTabSafeAreaView>,
      <Button
        key="my-button"
        type="shade"
        size="large"
        outline
        mt={6}
        onPress={() => {
          Linking.openURL("ledgerlive://storyly?g=142749&instance=17650&play=sg");
        }}
      >
        {`Display story with language "${trueLocale}"`}
      </Button>,
      showAssets ? (
        <Box background={colors.background.main} px={6} mt={6} key="PortfolioAssets">
          <RecoverBanner />
          <PortfolioAssets
            hideEmptyTokenAccount={hideEmptyTokenAccount}
            openAddModal={openAddModal}
          />
        </Box>
      ) : null,
      ...(showAssets && isAWalletCardDisplayed
        ? [
            <Box background={colors.background.main} key="CarouselTitle">
              <SectionContainer px={0} minHeight={240} isFirst>
                <SectionTitle
                  title={t("portfolio.carousel.title")}
                  containerProps={{ mb: 7, mx: 6 }}
                />
                <Carousel />
              </SectionContainer>
            </Box>,
          ]
        : []),
      ...(showAssets
        ? [
            <SectionContainer px={6} isFirst={!isAWalletCardDisplayed} key="AllocationsSection">
              <SectionTitle title={t("analytics.allocation.title")} />
              <Flex minHeight={94}>
                <AllocationsSection />
              </Flex>
            </SectionContainer>,
            <SectionContainer px={6} key="PortfolioOperationsHistorySection">
              <SectionTitle title={t("analytics.operations.title")} />
              <PortfolioOperationsHistorySection />
            </SectionContainer>,
          ]
        : [
            // If the user has no accounts we display an empty state
            <Flex flexDirection="column" mt={30} mx={6} key="PortfolioEmptyState">
              <RecoverBanner />
              <PortfolioEmptyState openAddAccountModal={openAddModal} />
            </Flex>,
          ]),
    ],
    [
      onBackFromUpdate,
      showAssets,
      trueLocale,
      colors.background.main,
      hideEmptyTokenAccount,
      openAddModal,
      isAWalletCardDisplayed,
      t,
    ],
  );

  return (
    <ReactNavigationPerformanceView screenName={ScreenName.Portfolio} interactive>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <RefreshableCollapsibleHeaderFlatList
        data={data}
        renderItem={({ item }: ListRenderItemInfo<unknown>) => {
          return item as JSX.Element;
        }}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        testID={showAssets ? "PortfolioAccountsList" : "PortfolioEmptyList"}
      />
      <AddAccountDrawer
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
        doesNotHaveAccount={!showAssets}
      />
    </ReactNavigationPerformanceView>
  );
}

export default PortfolioScreen;
