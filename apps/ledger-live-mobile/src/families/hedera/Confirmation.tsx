import React, { useMemo } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Trans } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps } from "@react-navigation/native";
import styled, { useTheme } from "styled-components/native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { TrackScreen } from "~/analytics";
import CurrencyIcon from "~/components/CurrencyIcon";
import NavigationScrollView from "~/components/NavigationScrollView";
import Alert from "~/components/Alert";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import ReceiveConfirmationTokenAlert from "./ReceiveConfirmationTokenAlert";
import { BaseStyledProps } from "@ledgerhq/native-ui/lib/components/styled";
import { getFreshAccountAddress } from "~/utils/address";
import CopyButton from "LLM/components/CopyButton";
import ShareButton from "LLM/components/ShareButton";

type ScreenProps = CompositeScreenProps<
  StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveConfirmation>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  readOnlyModeEnabled?: boolean;
} & ScreenProps;

export default function ReceiveConfirmation({ route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = account && getAccountCurrency(account);
  const mainAccountName = useMaybeAccountName(mainAccount);
  const name = mainAccountName;

  const freshAccountAddress = useMemo(() => {
    return mainAccount && getFreshAccountAddress(mainAccount);
  }, [mainAccount]);

  if (!mainAccount || !account || !currency) return null;

  const address = mainAccount.freshAddress;

  const { width } = getWindowDimensions();
  const QRSize = Math.round(width / 1.8 - 16);
  const QRContainerSize = QRSize + 16 * 4;

  return (
    <Flex flex={1}>
      <NavigationScrollView
        testID="receive-screen-scrollView"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <TrackScreen category="ReceiveFunds" name="Confirmation" currencyName={currency.name} />
        <Flex flexDirection="column" justifyContent="space-around" flex={1}>
          <Box alignItems="center" justifyContent="center" p={0}>
            <Flex
              alignItems="center"
              justifyContent="center"
              width={QRContainerSize}
              p={6}
              mt={10}
              bg={colors.opacityDefault.c05}
              borderRadius={2}
            >
              <View>
                <Box mb={6}>
                  <Text
                    variant={"body"}
                    fontWeight={"semiBold"}
                    textAlign={"center"}
                    numberOfLines={1}
                    testID={"receive-account-name-" + mainAccountName}
                  >
                    {mainAccountName}
                  </Text>
                </Box>
                <Flex
                  p={6}
                  borderRadius={24}
                  position="relative"
                  bg="constant.white"
                  borderWidth={1}
                  borderColor="neutral.c40"
                  alignItems="center"
                  justifyContent="center"
                  testID={"receive-qr-code-container-" + mainAccountName}
                >
                  <QRCode size={QRSize} value={freshAccountAddress} ecl="H" />
                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    width={QRSize * 0.3}
                    height={QRSize * 0.3}
                    bg="constant.white"
                    position="absolute"
                  >
                    <CurrencyIcon currency={currency} size={48} />
                  </Flex>
                </Flex>
                <Text
                  testID="receive-fresh-address"
                  variant={"body"}
                  fontWeight={"medium"}
                  textAlign={"center"}
                  mt={6}
                >
                  {freshAccountAddress}
                </Text>
              </View>
            </Flex>
            {mainAccount.derivationMode === "taproot" ? (
              <Flex mt={6} px={6} alignSelf="stretch">
                <Alert type="warning">
                  <Trans i18nKey="transfer.receive.taprootWarning" />
                </Alert>
              </Flex>
            ) : null}
            <Flex width={QRContainerSize} flexDirection="row" mt={6}>
              <StyledPressable
                borderRadius={2}
                style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <ShareButton value={address} />
              </StyledPressable>
              <StyledPressable
                borderRadius={2}
                isFlex
                style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <CopyButton text={address}>
                  <Trans i18nKey="transfer.receive.copyAddress" />
                </CopyButton>
              </StyledPressable>
            </Flex>
          </Box>
          <Flex px={6} flexDirection="column" rowGap={8} mt={6} mb={4}>
            <Alert type="security">
              <Trans
                i18nKey="hedera.currentAddress.messageIfVirtual"
                values={{
                  name,
                }}
              />
            </Alert>
            <ReceiveConfirmationTokenAlert account={account} mainAccount={mainAccount} />
          </Flex>
        </Flex>
      </NavigationScrollView>
    </Flex>
  );
}

const StyledPressable = styled.Pressable<BaseStyledProps & { isFlex?: boolean }>`
  padding: 4px;
  background-color: ${({ theme }) => theme.colors.opacityDefault.c05};
  margin-right: 4px;
  ${({ isFlex }) =>
    isFlex &&
    `
      flex: 1;
    `}
`;
