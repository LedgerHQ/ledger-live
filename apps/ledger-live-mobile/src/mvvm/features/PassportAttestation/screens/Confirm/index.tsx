import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationConfirm
  >
>;

function formatDob(yymmdd: string): string {
  if (yymmdd.length !== 6) return yymmdd;
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const century = yy <= 30 ? 2000 : 1900;
  return `${dd}/${mm}/${century + yy}`;
}

export default function ConfirmScreen({ navigation, route }: Props) {
  const { mrzData } = route.params;

  const fullName = `${mrzData.givenNames} ${mrzData.surname}`.trim() || "N/A";
  const [name, setName] = useState(fullName);
  const [docNumber, setDocNumber] = useState(mrzData.documentNumber);
  const [dob, setDob] = useState(formatDob(mrzData.dateOfBirth));
  const [expiry, setExpiry] = useState(formatDob(mrzData.expiryDate));

  const handleConfirm = useCallback(() => {
    navigation.navigate(ScreenName.PassportAttestationSelectProof, { mrzData });
  }, [navigation, mrzData]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Flex flex={1} flexDirection="column" justifyContent="space-between">
          <Flex flexDirection="column" px={16} pt={0}>
            <Flex flexDirection="column" rowGap={8} mb={24}>
              <Text variant="h4" color="neutral.c100" fontWeight="semiBold">
                Passport informations
              </Text>
              <Text variant="bodyLineHeight" color="neutral.c70">
                Review your information and edit them if needed
              </Text>
            </Flex>

            <Flex flexDirection="column" rowGap={16}>
              <InputField label="Full name" value={name} onChangeText={setName} testID="passport-fullname" />
              <InputField label="Document number" value={docNumber} onChangeText={setDocNumber} testID="passport-doc-number" />
              <InputField label="Date of birth" value={dob} onChangeText={setDob} testID="passport-dob" />
              <InputField label="Expiry date" value={expiry} onChangeText={setExpiry} testID="passport-expiry" />
            </Flex>
          </Flex>

          <Flex px={16} pb={16}>
            <Button type="main" size="large" onPress={handleConfirm} testID="passport-confirm-button">
              I verified my information
            </Button>
          </Flex>
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  testID: string;
}) {
  return (
    <InputContainer>
      <Text variant="small" color="neutral.c70">
        {label}
      </Text>
      <StyledInput value={value} onChangeText={onChangeText} testID={testID} />
    </InputContainer>
  );
}

const InputContainer = styled(Flex)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 8px;
  padding: 8px 16px;
  gap: 2px;
`;

const StyledInput = styled.TextInput`
  font-size: 16px;
  color: ${p => p.theme.colors.neutral.c100};
  padding: 0;
`;
