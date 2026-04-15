import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ActivityIndicator, View } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import SelectDevice2, { type SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { useLedgerProofEncryption } from "../SelectProof/useLedgerProofEncryption";
import { usePassportAttestation } from "../../hooks/usePassportAttestation";
import { useZkProofWebView } from "../../hooks/useZkProofWebView";
import { setZkBridge } from "../../utils/zkProof";
import type { AgeAttestationLocalState } from "~/reducers/ageAttestation";
import type { AgeProof } from "../../utils/zkProof";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationGenerateProof
  >
>;

export default function GenerateProofScreen({ navigation, route }: Props) {
  const { mrzData, passportData } = route.params;
  const { createProof, saveAgeAttestation, isLoading: isGeneratingProof } = usePassportAttestation();
  const { encryptProofWithDevice, isEncrypting } = useLedgerProofEncryption();
  const [rawProof, setRawProof] = useState<AgeProof | null>(null);
  const [isPreparingProof, setIsPreparingProof] = useState(false);
  const { webViewElement, isReady, generateProof: zkGenerate, verifyProof: zkVerify } =
    useZkProofWebView();
  const isZkReadyRef = useRef(isReady);
  const proofStartedRef = useRef(false);
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
      },
      spinnerSection: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: theme.spacings.s16,
      },
      description: {
        marginTop: theme.spacings.s8,
      },
      deviceSection: {
        flex: 1,
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: theme.spacings.s16,
      },
      helperText: {
        textAlign: "center",
        marginBottom: theme.spacings.s12,
      },
    }),
    [],
  );

  useEffect(() => {
    isZkReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      setZkBridge({ generateProof: zkGenerate, verifyProof: zkVerify });
    }

    return () => {
      setZkBridge(null);
    };
  }, [isReady, zkGenerate, zkVerify]);

  const requestToSetHeaderOptions = useCallback(
    (_request: SetHeaderOptionsRequest) => undefined,
    [],
  );

  const waitForZkBridgeReady = useCallback(async () => {
    if (isZkReadyRef.current) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let waitedMs = 0;
      const interval = setInterval(() => {
        if (isZkReadyRef.current) {
          clearInterval(interval);
          resolve();
          return;
        }

        waitedMs += 100;

        if (waitedMs >= 15000) {
          clearInterval(interval);
          reject(new Error("ZK bridge initialization timed out"));
        }
      }, 100);
    });
  }, []);

  const startProofPreparation = useCallback(async () => {
    if (proofStartedRef.current || rawProof) {
      return;
    }

    proofStartedRef.current = true;
    setIsPreparingProof(true);

    try {
      await waitForZkBridgeReady();
      const proof = await createProof(mrzData, passportData);
      setRawProof(proof);
    } catch (error) {
      proofStartedRef.current = false;
      const message =
        error instanceof Error ? error.message : "Failed to generate your proof.";
      Alert.alert("Proof generation error", message, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setIsPreparingProof(false);
    }
  }, [createProof, mrzData, navigation, passportData, rawProof, waitForZkBridgeReady]);

  useEffect(() => {
    if (isReady) {
      void startProofPreparation();
    }
  }, [isReady, startProofPreparation]);

  const handleSelectDevice = useCallback(
    async (_device: Device, discoveredDevice: DiscoveredDevice) => {
      if (!rawProof) {
        Alert.alert("Proof unavailable", "The proof is still being generated. Please wait.");
        return;
      }

      try {
        const encryptedProof = await encryptProofWithDevice(discoveredDevice, rawProof.proof);

        const encryptedAttestation: AgeAttestationLocalState = {
          verified: true,
          proof: encryptedProof,
          publicSignals: rawProof.publicSignals,
          minimumAge: rawProof.minimumAge,
          verifiedAt: rawProof.verifiedAt,
          proofHash: rawProof.proofHash,
        };

        await saveAgeAttestation(encryptedAttestation);
        navigation.navigate(ScreenName.PassportAttestationSuccess, { proof: rawProof });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to encrypt payload with your Ledger.";
        Alert.alert("Connection error", message);
      }
    },
    [encryptProofWithDevice, navigation, rawProof, saveAgeAttestation],
  );

  const isProcessing = isEncrypting || isGeneratingProof || isPreparingProof;

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      {webViewElement}
      <View style={styles.root}>
        <View style={styles.spinnerSection}>
          <ActivityIndicator size="large" color="white" />
          <Text typography="heading4SemiBold" lx={{ color: "base", marginTop: "s16" }}>
            Generating your proof
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }} style={styles.description}>
            It will only take seconds
          </Text>
        </View>

        {!isProcessing ? (
          <View style={styles.deviceSection}>
            <Text typography="body3" lx={{ color: "muted" }} style={styles.helperText}>
              Select a Ledger device to continue.
            </Text>
            <Box lx={{ flex: 1 }}>
              <SelectDevice2
                onSelect={handleSelectDevice}
                stopBleScanning={isProcessing}
                requestToSetHeaderOptions={requestToSetHeaderOptions}
                autoSelectLastConnectedDevice={false}
                performDeviceLockedCheck={false}
              />
            </Box>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
