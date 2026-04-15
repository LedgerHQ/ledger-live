import React, { useCallback, useEffect, useRef } from "react";
import { Alert, ActivityIndicator } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
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
        rowGap={16}
      >
        <ActivityIndicator size="large" color={colors.neutral.c100} />

        <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
          Generating your proof
        </Text>

        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
          It will only take seconds
        </Text>
      </Flex>
    </SafeAreaView>
  );
}
