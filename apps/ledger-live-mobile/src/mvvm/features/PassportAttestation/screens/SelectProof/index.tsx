import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import type { SelectedProof } from "./useLedgerProofEncryption";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationSelectProof
  >
>;

const PROOF_OPTIONS: { id: SelectedProof; title: string; description: string }[] = [
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
  const { mrzData, passportData } = route.params;
  const [selected, setSelected] = useState<Set<SelectedProof>>(new Set());
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
        justifyContent: "space-between",
      },
      content: {
        flex: 1,
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s8,
      },
      description: {
        marginTop: theme.spacings.s8,
      },
      cards: {
        marginTop: theme.spacings.s24,
        gap: theme.spacings.s16,
      },
      card: {
        minHeight: 80,
        borderRadius: 16,
        backgroundColor: theme.colors.bg.muted,
        borderWidth: 1,
        borderColor: "transparent",
        paddingHorizontal: theme.spacings.s16,
        paddingVertical: theme.spacings.s16,
        justifyContent: "center",
      },
      cardSelected: {
        borderColor: "#DFA8FF",
      },
      cardTitle: {
        marginBottom: theme.spacings.s4,
      },
      footer: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s12,
        paddingBottom: theme.spacings.s16,
      },
    }),
    [],
  );

  const toggleProof = useCallback((id: SelectedProof) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isGenerateDisabled = useMemo(
    () => selected.size === 0,
    [selected],
  );

  const handleGenerate = useCallback(() => {
    if (selected.size === 0) {
      return;
    }

    if (!selected.has("age")) {
      Alert.alert(
        "Proof unavailable",
        "Age proof is the only proof currently available in Ledger Live.",
      );
      return;
    }

    navigation.navigate(ScreenName.PassportAttestationGenerateProof, {
      mrzData,
      passportData,
      selectedProofs: Array.from(selected),
    });
  }, [mrzData, navigation, passportData, selected]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <View style={styles.root}>
        <View style={styles.content}>
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            Select the proof you want
          </Text>
          <Text typography="body2" lx={{ color: "muted" }} style={styles.description}>
            You can generate multiple proofs at once
          </Text>

          <View style={styles.cards}>
            {PROOF_OPTIONS.map(option => {
              const isSelected = selected.has(option.id);

              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggleProof(option.id)}
                  testID={`proof-option-${option.id}`}
                >
                  <View style={[styles.card, isSelected && styles.cardSelected]}>
                    <Text
                      typography="body2SemiBold"
                      lx={{ color: "base" }}
                      style={styles.cardTitle}
                    >
                      {option.title}
                    </Text>
                    <Text typography="body3" lx={{ color: "muted" }}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            appearance="base"
            size="lg"
            onPress={handleGenerate}
            disabled={isGenerateDisabled}
            testID="generate-proof-button"
          >
            Generate proof
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
