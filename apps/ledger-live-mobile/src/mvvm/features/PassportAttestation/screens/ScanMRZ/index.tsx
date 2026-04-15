import React, { useCallback, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import type { MrzData } from "../../utils/mrzParser";
import CameraScannerScreen from "./CameraScannerScreen";
import { emptyMrzData, sanitizeMrzDataForConfirmation } from "./form";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationScanMRZ
  >
>;

export default function ScanMRZScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [mrzDataDraft, setMrzDataDraft] = useState<MrzData>(emptyMrzData);
  const [showCamera, setShowCamera] = useState(true);

  const handleMrzFromCamera = useCallback(
    (data: MrzData) => {
      navigation.navigate(ScreenName.PassportAttestationConfirm, {
        mrzData: sanitizeMrzDataForConfirmation(data),
      });
    },
    [navigation],
  );

  const updateMrzField = useCallback(
    (field: "documentNumber" | "dateOfBirth" | "expiryDate", value: string) => {
      setMrzDataDraft(current => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    const cleanMrzData = sanitizeMrzDataForConfirmation(mrzDataDraft);
    const { documentNumber, dateOfBirth, expiryDate } = cleanMrzData;

    if (documentNumber.length < 1) {
      Alert.alert("Missing Field", "Please enter your document number.");
      return;
    }
    if (dateOfBirth.length !== 6) {
      Alert.alert("Invalid Date of Birth", "Enter date of birth as YYMMDD (e.g. 900115).");
      return;
    }
    if (expiryDate.length !== 6) {
      Alert.alert("Invalid Expiry Date", "Enter expiry date as YYMMDD (e.g. 301231).");
      return;
    }

    navigation.navigate(ScreenName.PassportAttestationConfirm, { mrzData: cleanMrzData });
  }, [mrzDataDraft, navigation]);

  const handleDemo = useCallback(() => {
    const demoMrz: MrzData = {
      documentNumber: "L898902C3",
      dateOfBirth: "900101",
      expiryDate: "301231",
      nationality: "FRA",
      surname: "DEMO",
      givenNames: "USER",
      sex: "M",
    };
    navigation.navigate(ScreenName.PassportAttestationConfirm, { mrzData: demoMrz });
  }, [navigation]);

  if (showCamera) {
    return (
      <CameraScannerScreen
        onMrzDetected={handleMrzFromCamera}
        onMockData={handleDemo}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Flex flex={1} flexDirection="column" px={6} pt={6}>
          <Flex flexDirection="column" alignItems="center" rowGap={12} mb={24}>
            <IconContainer borderRadius={50}>
              <Icons.IdCard size="L" color="primary.c80" />
            </IconContainer>
            <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
              Take a picture of your passport
            </Text>
            <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
              Scan the bar code of your passport.
            </Text>
          </Flex>

          <Flex flexDirection="column" rowGap={12} mb={24}>
            <Flex flexDirection="column" rowGap={4}>
              <Text variant="small" color="neutral.c70" fontWeight="semiBold">
                Document Number
              </Text>
              <StyledInput
                value={mrzDataDraft.documentNumber}
                onChangeText={(value: string) => updateMrzField("documentNumber", value)}
                placeholder="e.g. L898902C3"
                autoCapitalize="characters"
                autoCorrect={false}
                testID="passport-doc-number"
                placeholderTextColor={colors.neutral.c50}
              />
            </Flex>

            <Flex flexDirection="column" rowGap={4}>
              <Text variant="small" color="neutral.c70" fontWeight="semiBold">
                Date of Birth (YYMMDD)
              </Text>
              <StyledInput
                value={mrzDataDraft.dateOfBirth}
                onChangeText={(value: string) => updateMrzField("dateOfBirth", value)}
                placeholder="e.g. 900115"
                keyboardType="number-pad"
                maxLength={6}
                testID="passport-dob"
                placeholderTextColor={colors.neutral.c50}
              />
            </Flex>

            <Flex flexDirection="column" rowGap={4}>
              <Text variant="small" color="neutral.c70" fontWeight="semiBold">
                Expiry Date (YYMMDD)
              </Text>
              <StyledInput
                value={mrzDataDraft.expiryDate}
                onChangeText={(value: string) => updateMrzField("expiryDate", value)}
                placeholder="e.g. 301231"
                keyboardType="number-pad"
                maxLength={6}
                testID="passport-expiry"
                placeholderTextColor={colors.neutral.c50}
              />
            </Flex>
          </Flex>

          <Flex flexDirection="column" rowGap={10}>
            <Button type="main" onPress={handleSubmit} testID="passport-submit-button">
              Continue
            </Button>
            <Button
              type="default"
              outline
              onPress={() => setShowCamera(true)}
              testID="passport-camera-button"
            >
              Scan Again with Camera
            </Button>
            <Button type="default" outline onPress={handleDemo} testID="passport-demo-button">
              Use Demo Passport
            </Button>
          </Flex>
        </Flex>
      </ScrollView>
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

const StyledInput = styled.TextInput`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: ${p => p.theme.colors.neutral.c100};
  background-color: ${p => p.theme.colors.opacityDefault.c05};
`;
