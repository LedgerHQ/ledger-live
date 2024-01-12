import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import Step1Cropping from "~/screens/CustomImage/Step1Crop";
import Step2ChooseContrast from "~/screens/CustomImage/Step2ChooseContrast";
import Step3Transfer, { step3TransferHeaderOptions } from "~/screens/CustomImage/Step3Transfer";
import ErrorScreen from "~/screens/CustomImage/ErrorScreen";
import Step0Welcome from "~/screens/CustomImage/Step0Welcome";
import PreviewPreEdit from "~/screens/CustomImage/PreviewPreEdit";
import PreviewPostEdit from "~/screens/CustomImage/PreviewPostEdit";
import NFTGallerySelector from "~/screens/CustomImage/NFTGallerySelector";
import { CustomImageNavigatorParamList } from "./types/CustomImageNavigator";

export default function CustomImageNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.CustomImageStep0Welcome}
        component={Step0Welcome}
        options={{ title: "", headerRight: undefined }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep1Crop}
        component={Step1Cropping}
        options={{ title: t("customImage.cropImage"), headerRight: undefined }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep2Preview}
        component={Step2ChooseContrast}
        options={{
          title: t("customImage.chooseConstrast"),
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep3Transfer}
        component={Step3Transfer}
        options={{ ...step3TransferHeaderOptions }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageErrorScreen}
        component={ErrorScreen}
        options={{
          title: "",
          headerLeft: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomImagePreviewPreEdit}
        component={PreviewPreEdit}
        options={{
          title: t("customImage.preview.title"),
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomImagePreviewPostEdit}
        component={PreviewPostEdit}
        options={{
          title: t("customImage.preview.title"),
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageNFTGallery}
        component={NFTGallerySelector}
        options={{
          title: t("customImage.nftGallery.title"),
          headerRight: undefined,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<CustomImageNavigatorParamList>();
