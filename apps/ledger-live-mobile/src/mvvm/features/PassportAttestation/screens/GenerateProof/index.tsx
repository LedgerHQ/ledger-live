import React, { useCallback, useEffect, useRef } from "react";
import { Alert, ActivityIndicator } from "react-native";
import { Box, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import { usePassportAttestation } from "../../hooks/usePassportAttestation";
import { useZkProofWebView } from "../../hooks/useZkProofWebView";
import { setZkBridge } from "../../utils/zkProof";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationGenerateProof
  >
>;

export default function GenerateProofScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { mrzData, passportData } = route.params;
  const { generateProof } = usePassportAttestation();
  const started = useRef(false);
  const { webViewElement, isReady, generateProof: zkGenerate, verifyProof: zkVerify } =
    useZkProofWebView();

  // Wire the ZK bridge when the WebView is ready
  useEffect(() => {
    if (isReady) {
      setZkBridge({ generateProof: zkGenerate, verifyProof: zkVerify });
    }
    return () => {
      setZkBridge(null);
    };
  }, [isReady, zkGenerate, zkVerify]);

  const startProofGeneration = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    try {
      const proof = await generateProof(mrzData, passportData);
      navigation.navigate(ScreenName.PassportAttestationSuccess, { proof });
    } catch (e) {
      started.current = false;
      const message = e instanceof Error ? e.message : "Proof generation failed";
      Alert.alert("Error", message);
      navigation.goBack();
    }
  }, [generateProof, mrzData, passportData, navigation]);

  // Trigger proof generation once WebView is ready
  useEffect(() => {
    if (isReady) {
      startProofGeneration();
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      {webViewElement}
      <Flex
        flex={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={6}
        rowGap={24}
      >
        <IconContainer borderRadius={50}>
          <Icons.ShieldCheck size="L" color={colors.primary.c80} />
        </IconContainer>

        <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
          Generating ZK Proof
        </Text>

        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
          Creating a zero-knowledge proof that you are over 18 without revealing your date of
          birth...
        </Text>

        <ActivityIndicator size="large" color={colors.primary.c80} />

        <Text variant="small" color="neutral.c50" textAlign="center">
          This may take a few seconds
        </Text>
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
