import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as NativeTextInput,
  View,
} from "react-native";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import {
  createPassportReviewForm,
  sanitizeDisplayDateInput,
  serializePassportReviewForm,
  type PassportReviewForm,
} from "./form";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationConfirm
  >
>;

const invalidFieldMessages: Record<keyof PassportReviewForm, string> = {
  documentNumber: "Enter a valid document number to continue.",
  dateOfBirth: "Enter a valid date of birth in DD/MM/YYYY format.",
  expiryDate: "Enter a valid expiry date in DD/MM/YYYY format.",
};

export default function ConfirmScreen({ navigation, route }: Props) {
  const { mrzData } = route.params;
  const styles = useStyleSheet(
    theme => ({
      keyboard: {
        flex: 1,
      },
      scroll: {
        flex: 1,
      },
      scrollContent: {
        flexGrow: 1,
        justifyContent: "space-between",
      },
      content: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s8,
      },
      description: {
        marginTop: theme.spacings.s8,
      },
      fields: {
        marginTop: theme.spacings.s24,
        gap: theme.spacings.s16,
      },
      field: {
        borderRadius: 12,
        backgroundColor: theme.colors.bg.muted,
        paddingHorizontal: theme.spacings.s16,
        paddingVertical: theme.spacings.s12,
      },
      input: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        marginTop: theme.spacings.s4,
        color: theme.colors.text.base,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
      },
      footer: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s12,
        paddingBottom: theme.spacings.s16,
      },
    }),
    [],
  );
  const [form, setForm] = useState(() => createPassportReviewForm(mrzData));

  const updateField = useCallback(
    (field: keyof PassportReviewForm, value: string) => {
      setForm(current => ({
        ...current,
        [field]: value,
      }));
    },
    [setForm],
  );

  const handleConfirm = useCallback(() => {
    const result = serializePassportReviewForm(form, mrzData);

    if (!result.ok) {
      Alert.alert("Invalid passport information", invalidFieldMessages[result.field]);
      return;
    }

    navigation.navigate(ScreenName.PassportAttestationReadNFC, { mrzData: result.mrzData });
  }, [form, mrzData, navigation]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              Passport informations
            </Text>
            <Text typography="body2" lx={{ color: "muted" }} style={styles.description}>
              Review your information and edit them if needed
            </Text>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Document number
                </Text>
                <NativeTextInput
                  value={form.documentNumber}
                  onChangeText={value => updateField("documentNumber", value.toUpperCase())}
                  style={styles.input}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                  selectionColor="white"
                  testID="passport-confirm-document-number"
                />
              </View>

              <View style={styles.field}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Date of birth
                </Text>
                <NativeTextInput
                  value={form.dateOfBirth}
                  onChangeText={value =>
                    updateField("dateOfBirth", sanitizeDisplayDateInput(value))
                  }
                  style={styles.input}
                  keyboardType="number-pad"
                  keyboardAppearance="dark"
                  selectionColor="white"
                  testID="passport-confirm-date-of-birth"
                />
              </View>

              <View style={styles.field}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  Expiry date
                </Text>
                <NativeTextInput
                  value={form.expiryDate}
                  onChangeText={value => updateField("expiryDate", sanitizeDisplayDateInput(value))}
                  style={styles.input}
                  keyboardType="number-pad"
                  keyboardAppearance="dark"
                  selectionColor="white"
                  testID="passport-confirm-expiry-date"
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              appearance="base"
              size="lg"
              onPress={handleConfirm}
              testID="passport-confirm-button"
            >
              I verified my information
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
