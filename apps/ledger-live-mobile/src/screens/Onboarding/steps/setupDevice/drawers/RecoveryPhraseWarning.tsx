import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Icons, ScrollContainer } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ModalHeader } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
import { StackNavigatorProps } from "../../../../../components/RootNavigator/types/helpers";
import { OnboardingCarefulWarningParamList } from "../../../../../components/RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "../../../../../const";

type NavigationProps = StackNavigatorProps<
  OnboardingCarefulWarningParamList,
  ScreenName.OnboardingModalRecoveryPhraseWarning
>;

const OnboardingRecoveryPhraseWarning = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();

  const handlePress = () => {
    navigation.goBack();
    if (route.params.onNext) route.params.onNext();
  };

  return (
    <>
      <ScrollContainer flex={1}>
        <ModalHeader
          Icon={Icons.WarningMedium}
          iconColor={"warning.c100"}
          title={t(
            "onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.title",
          )}
          description={t(
            "onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.desc",
          )}
        />
      </ScrollContainer>
      <Button type="main" size="large" onPress={handlePress} mt={4}>
        {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.cta")}
      </Button>
    </>
  );
};

export default OnboardingRecoveryPhraseWarning;
