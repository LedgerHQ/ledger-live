import { CompositeScreenProps } from "@react-navigation/native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import styled from "styled-components/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { Button, Flex, Icons, Text } from "@ledgerhq/native-ui";

import Collapsible from "LLM/components/Collapsible";
import CopyButton from "LLM/components/CopyButton";
import { track, TrackScreen } from "~/analytics";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import GenericErrorView from "~/components/GenericErrorView";
import Card from "~/components/Card";
import useExportLogs from "~/components/useExportLogs";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { urls } from "~/utils/urls";

type Props = CompositeScreenProps<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendBroadcastError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function SendBroadcastError({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { account } = useSelector(accountScreenSelector(route));
  const currency = account ? getAccountCurrency(account) : null;

  const error = route.params?.error;
  const helperUrl = error?.url ?? urls.faq;
  const gotoSupport = useCallback(() => Linking.openURL(helperUrl), [helperUrl]);
  const exportLogs = useExportLogs();

  const retry = useCallback(() => {
    track("SendErrorRetry");
    navigation.goBack();
  }, [navigation]);

  if (!error) return null;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        marginBottom: insets.bottom,
      }}
    >
      <ScrollView style={{ flex: 1, marginBottom: 16 }}>
        <TrackScreen category="SendFunds" name="ValidationError" currencyName={currency?.name} />
        <GenericErrorView error={error} hasExportLogButton={false} />

        <Collapsible px={16} mt={24} mb={16} title={t("errors.TransactionBroadcastError.needHelp")}>
          <Flex px={16}>
            <InformativeBanner
              title={t("errors.TransactionBroadcastError.helpCenter.title")}
              description={t("errors.TransactionBroadcastError.helpCenter.desc")}
            >
              <InformativeBannerButton Icon={<Icons.Support />} onPress={gotoSupport}>
                <Text fontWeight="semiBold">
                  {t("errors.TransactionBroadcastError.helpCenter.cta")}
                </Text>
              </InformativeBannerButton>
            </InformativeBanner>

            <InformativeBanner
              title={t("errors.TransactionBroadcastError.technical.title")}
              description={error.message}
              numberOfLines={3}
            >
              <Flex flexDirection="row" columnGap={8}>
                <InformativeBannerButton Icon={<Icons.Download />} onPress={exportLogs}>
                  <Text fontWeight="semiBold">
                    {t("errors.TransactionBroadcastError.technical.cta")}
                  </Text>
                </InformativeBannerButton>
                <InformativeBannerButton as={CopyButton} text={error.message} />
              </Flex>
            </InformativeBanner>
          </Flex>
        </Collapsible>
      </ScrollView>

      <Flex px={16}>
        <Button type="shade" onPress={retry}>
          {t("send.validation.button.retry")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

type InformativeBannerProps = {
  title: string;
  description: string;
  numberOfLines?: number;
  children: React.ReactNode;
};

function InformativeBanner({
  title,
  description,
  numberOfLines,
  children,
}: InformativeBannerProps) {
  return (
    <Card
      p={6}
      mb={6}
      borderRadius={8}
      backgroundColor="opacityDefault.c05"
      alignItems="flex-start"
      rowGap={16}
    >
      <Text variant="paragraphLineHeight" numberOfLines={numberOfLines}>
        <Text>{title} :</Text> <Text color="neutral.c70">{description}</Text>
      </Text>
      {children}
    </Card>
  );
}

const InformativeBannerButton = styled(Button).attrs({
  isNewIcon: true,
  iconPosition: "left",
  size: "small",
})`
  background-color: ${({ theme }) => theme.colors.opacityDefault.c05};
  border-radius: 8px;
`;
