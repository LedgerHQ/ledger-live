import React, { useCallback, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationSelectProof
  >
>;

type ProofType = "age" | "ofac" | "legalName";

const PROOF_OPTIONS: { id: ProofType; title: string; description: string }[] = [
  {
    id: "age",
    title: "Age proof",
    description: "You meet the minimum age requirement.",
  },
  {
    id: "ofac",
    title: "OFAC",
    description: "You are not on any international sanctions or restricted persons lists.",
  },
  {
    id: "legalName",
    title: "Legal Name",
    description: "Your identity has been verified against a government-issued ID.",
  },
];

export default function SelectProofScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { mrzData } = route.params;
  const [selected, setSelected] = useState<Set<ProofType>>(new Set());

  const toggleProof = useCallback((id: ProofType) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(() => {
    navigation.navigate(ScreenName.PassportAttestationReadNFC, { mrzData });
  }, [navigation, mrzData]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <Flex flex={1} flexDirection="column" justifyContent="space-between">
        <Flex flexDirection="column" px={16} pt={0}>
          <Flex flexDirection="column" rowGap={8} mb={24}>
            <Text variant="h4" color="neutral.c100" fontWeight="semiBold">
              Select the proof you want
            </Text>
            <Text variant="bodyLineHeight" color="neutral.c70">
              You can generate multiple proofs at once
            </Text>
          </Flex>

          <Flex flexDirection="column" rowGap={16}>
            {PROOF_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                onPress={() => toggleProof(option.id)}
                activeOpacity={0.7}
                testID={`proof-option-${option.id}`}
              >
                <ProofCard selected={selected.has(option.id)} borderColor={colors.primary.c80}>
                  <Text variant="body" color="neutral.c100" fontWeight="semiBold">
                    {option.title}
                  </Text>
                  <Text variant="small" color="neutral.c70">
                    {option.description}
                  </Text>
                </ProofCard>
              </TouchableOpacity>
            ))}
          </Flex>
        </Flex>

        <Flex px={16} pb={16}>
          <Button
            type="main"
            size="large"
            onPress={handleGenerate}
            disabled={selected.size === 0}
            testID="generate-proof-button"
          >
            Generate proof
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

const ProofCard = styled(Flex)<{ selected: boolean; borderColor: string }>`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 12px;
  padding: 16px;
  gap: 4px;
  border-width: ${p => (p.selected ? "2px" : "1px")};
  border-color: ${p => (p.selected ? p.borderColor : p.theme.colors.neutral.c40)};
`;
