import React, { useCallback, useEffect } from "react";
import { Alert, ActivityIndicator } from "react-native";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import { usePassportAttestation } from "../../hooks/usePassportAttestation";
import { cancelNfcScan } from "../../utils/passportReader";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationReadNFC
  >
>;

export default function ReadNFCScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { mrzData } = route.params;
  const { readPassport, isLoading, error, checkNfcSupport } = usePassportAttestation();

  const startNfcRead = useCallback(async () => {
    try {
      const supported = await checkNfcSupport();

      if (!supported) {
        Alert.alert("NFC Unsupported", "This iPhone does not support NFC passport scanning.");
        return;
      }

      const passportData = await readPassport(mrzData);
      navigation.navigate(ScreenName.PassportAttestationGenerateProof, {
        mrzData,
        passportData,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "NFC read failed";
      Alert.alert("NFC Error", message);
    }
  }, [checkNfcSupport, readPassport, mrzData, navigation]);

  useEffect(() => {
    void startNfcRead();
    return () => {
      void cancelNfcScan();
    };
  }, [startNfcRead]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <Flex
        flex={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={6}
        rowGap={24}
      >
        <IconContainer borderRadius={50}>
          <Icons.Nano size="L" color={colors.primary.c80} />
        </IconContainer>

        <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
          Reading Passport
        </Text>

        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
          Hold your phone against the back cover of your passport. Keep it still until the reading is
          complete.
        </Text>

        {isLoading && <ActivityIndicator size="large" color={colors.primary.c80} />}

        {error && (
          <Flex flexDirection="column" alignItems="center" rowGap={12}>
            <Text variant="body" color="error.c60" textAlign="center">
              {error}
            </Text>
            <Button type="main" outline onPress={startNfcRead}>
              Retry
            </Button>
          </Flex>
        )}
      </Flex>
    </SafeAreaView>
  );
}

const IconContainer = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
