import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Flex, Text, Button, Tag } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import {
  RootComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import Animation from "~/components/Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { getProductName } from "LLM/utils/getProductName";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsSign>
>;

export default function PerpsSign({ navigation, route }: NavigationProps) {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const theme = dark ? "dark" : "light";
  const { device, sign, onSuccess, onError, onCancel } = route.params;
  const [error, setError] = useState<Error | null>(null);
  const productName = getProductName(device.modelId);

  useEffect(() => {
    let cancelled = false;

    sign()
      .then(result => {
        if (cancelled) return;
        onSuccess(result);
        navigation.goBack();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError(e);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (!error) {
      onCancel();
    }
    navigation.goBack();
  };

  if (error) {
    return (
      <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
        <GenericErrorView
          error={error}
          hasExportLogButton={false}
          footerComponent={
            <Button type="main" onPress={handleClose} alignSelf="stretch" mt={6}>
              {t("common.close")}
            </Button>
          }
        />
      </Flex>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ backgroundColor: colors.background }}
    >
      <Flex flex={1} alignItems="center" justifyContent="center" p={6} rowGap={4}>
        <Animation
          source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
          style={getDeviceAnimationStyles(device.modelId)}
        />
        {device.deviceName ? (
          <Tag my={8} uppercase={false}>
            {device.deviceName}
          </Tag>
        ) : null}
        <Text variant="h4" fontWeight="semiBold" textAlign="center" mt={4}>
          {t("SignMessageConfirm.title", { wording: productName })}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
          {t("SignMessageConfirm.description")}
        </Text>
      </Flex>
    </ScrollView>
  );
}
