import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text, Button, Checkbox } from "@ledgerhq/native-ui";
import { IconsLegacy } from "@ledgerhq/native-ui/assets/index";

import Touchable from "~/components/Touchable";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { setAnalytics } from "~/actions/settings";
import { useAcceptGeneralTerms } from "~/logic/terms";
import { useLocale } from "~/context/Locale";
import { urls } from "~/utils/urls";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "~/components/StyledStatusBar";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";

type LinkBoxProps = {
  text: React.ReactNode;
  url: string;
  event: string;
  mb?: number;
};

const LinkBox = React.memo(({ text, url, event, mb = 0 }: LinkBoxProps) => (
  <Touchable onPress={() => Linking.openURL(url)} event={event}>
    <StyledStatusBar barStyle="dark-content" />
    <Flex
      borderRadius={4}
      flexDirection="row"
      paddingX={6}
      paddingY={6}
      backgroundColor="palette.primary.c20"
      mb={mb}
    >
      <Text color="palette.primary.c80" variant="body" fontSize="14px" fontWeight="semiBold" mr={3}>
        {text}
      </Text>
      <IconsLegacy.ExternalLinkMedium color="palette.primary.c80" size="18px" />
    </Flex>
  </Touchable>
));

type NavigationProp = StackNavigatorNavigation<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingTermsOfUse
>;

function OnboardingStepTerms() {
  const { locale = "en" } = useLocale();
  const dispatch = useDispatch();
  const setAccepted = useAcceptGeneralTerms();
  const [toggle, setToggle] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  const onSwitch = useCallback(() => {
    setToggle(!toggle);
  }, [toggle]);

  const next = useCallback(() => {
    setAccepted();
    dispatch(setAnalytics(true));

    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [setAccepted, dispatch, navigation]);

  return (
    <OnboardingView
      hasBackButton
      title={t("Terms.title")}
      subTitle={t("Terms.subTitle")}
      footer={
        <Button disabled={!toggle} onPress={next} testID="Onboarding - ToU accepted" type="main">
          {t("Terms.cta")}
        </Button>
      }
    >
      <LinkBox
        text={t("Terms.service")}
        url={(urls.terms as Record<string, string>)[locale] || urls.terms.en}
        event="OpenTerms"
        mb={6}
      />
      <LinkBox
        text={t("settings.about.privacyPolicy")}
        url={urls.privacyPolicy[locale as keyof typeof urls.privacyPolicy] ?? urls.privacyPolicy.en}
        event="OpenPrivacyPolicy"
      />
      <Flex flexDirection="row" mt={9}>
        <Checkbox checked={toggle} onChange={onSwitch} label={t("Terms.switchLabelFull")} />
      </Flex>
      <TrackScreen category="Onboarding" name="Terms" />
    </OnboardingView>
  );
}

export default OnboardingStepTerms;
