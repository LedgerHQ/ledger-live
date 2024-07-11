import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

import { ScreenName } from "~/const";
import SafeAreaView from "~/components/SafeAreaView";
type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

export function Success({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { created } = route.params;
  const title = created ? "walletSync.success.activation" : "walletSync.success.sync";
  const desc = created ? "walletSync.success.activationDesc" : "walletSync.success.syncDesc";

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <Flex flexDirection="column" alignItems="center" justifyContent="space-between" flex={1}>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap={16}>
          <Container borderRadius={50}>
            <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
          </Container>
          <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
            {t(title)}
          </Text>
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            {t(desc)}
          </Text>
        </Flex>
        <Flex flexDirection="column" rowGap={10}>
          <Button type="main">{t("walletSync.success.syncAnother")}</Button>
          <Button type="main" outline>
            {t("walletSync.success.close")}
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};

  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
