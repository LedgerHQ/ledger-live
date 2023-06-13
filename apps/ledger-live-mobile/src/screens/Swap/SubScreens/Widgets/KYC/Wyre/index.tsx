import React, { useEffect, useCallback, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation, Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { submitKYC, countries } from "@ledgerhq/live-common/exchange/swap/index";
import type { KYCData, KYCStatus } from "@ledgerhq/live-common/exchange/swap/types";
import { ScreenName } from "../../../../../../const";
import { Wyre as IconWyre } from "../../../../../../icons/swap/Wyre";
import LText from "../../../../../../components/LText";
import Button from "../../../../../../components/Button";
import { swapKYCSelector } from "../../../../../../reducers/settings";
import { setSwapKYCStatus } from "../../../../../../actions/settings";
import { Pending } from "./Pending";
import { Field } from "./Field";
import type { SwapNavigatorParamList } from "../../../../../../components/RootNavigator/types/SwapNavigator";
import type { StackNavigatorNavigation } from "../../../../../../components/RootNavigator/types/helpers";

export function WyreKYC() {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const { navigate } =
    useNavigation<StackNavigatorNavigation<SwapNavigatorParamList, ScreenName.SwapKYC>>();
  const swapKYC = useSelector(swapKYCSelector);
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const countryOptions = Object.entries(countries).map(([value, label]) => ({
    value,
    label,
  }));

  // TODO Might need a better setup if this form gets more complicated
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<{ value?: string }>({});
  const [country] = useState(countryOptions[0]);
  const [postalCode, setPostalCode] = useState("");

  const requiredFields = useMemo(
    () => ({
      firstName,
      lastName,
      dateOfBirth,
      street1,
      city,
      state,
      postalCode,
    }),
    [city, dateOfBirth, firstName, lastName, postalCode, state, street1],
  );

  const kycData: KYCData = useMemo(
    () => ({
      firstName,
      lastName,
      dateOfBirth,
      residenceAddress: {
        street1,
        street2,
        city,
        state: state?.value || "",
        country: country?.value,
        postalCode,
      },
    }),
    [city, country?.value, dateOfBirth, firstName, lastName, postalCode, state, street1, street2],
  );

  const onSelectState = useCallback(() => {
    navigate(ScreenName.SwapKYCStates, { onStateSelect: setState });
  }, [navigate]);

  const isValidDate = useMemo(
    () => !dateOfBirth || /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(dateOfBirth),
    [dateOfBirth],
  );

  const onValidateFields = useCallback(() => {
    const errors: Record<string, string> = {};

    for (const field in requiredFields) {
      if (
        !requiredFields[field as keyof typeof requiredFields] ||
        (field === "dateOfBirth" && requiredFields[field] && !isValidDate) ||
        (field === "state" && !Object.keys(requiredFields[field]).length)
      ) {
        errors[field] = t(`swap.kyc.wyre.form.${field}Error`);
      }
    }
    return errors;
  }, [isValidDate, requiredFields, t]);

  useEffect(() => {
    setErrors(onValidateFields);
  }, [onValidateFields, requiredFields, t]);

  const onSubmit = useCallback(() => {
    setHasSubmittedOnce(true);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    if (Object.entries(errors).length) return () => {};

    let cancelled = false;
    async function onSubmitKYC() {
      setLoading(true);

      const res = await submitKYC("wyre", kycData);
      if (cancelled) return;
      dispatch(
        setSwapKYCStatus({
          provider: "wyre",
          id: (res as KYCStatus)?.id,
          status: (res as KYCStatus).status,
        }),
      );
      setLoading(false);
    }
    onSubmitKYC();

    return () => {
      cancelled = true;
    };
  }, [dispatch, errors, kycData]);

  const color = colors.text;
  const borderColor = colors.fog;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        {swapKYC.wyre ? (
          <Pending status={swapKYC.wyre.status} onContinue={() => navigate(ScreenName.SwapTab)} />
        ) : (
          <>
            <ScrollView style={styles.scroll}>
              <View style={styles.wrapper}>
                <View style={styles.titleWrapper}>
                  <IconWyre size={18} />
                  <LText style={styles.title} color={"darkBlue"}>
                    <Trans i18nKey={"transfer.swap.kyc.wyre.title"} />
                  </LText>
                </View>
                <LText style={styles.subtitle} color={"smoke"}>
                  <Trans i18nKey={"transfer.swap.kyc.wyre.subtitle"} />
                </LText>

                <Field
                  isLoading={isLoading}
                  field={"firstName"}
                  onChange={setFirstName}
                  validate={hasSubmittedOnce}
                  error={errors?.firstName}
                />
                <Field
                  isLoading={isLoading}
                  field={"lastName"}
                  onChange={setLastName}
                  validate={hasSubmittedOnce}
                  error={errors?.lastName}
                />
                <Field
                  mask={"[0000]-[00]-[00]"}
                  isLoading={isLoading}
                  field={"dateOfBirth"}
                  onChange={setDateOfBirth}
                  validate={hasSubmittedOnce}
                  error={errors?.dateOfBirth}
                />
                <Field
                  isLoading={isLoading}
                  field={"street1"}
                  onChange={setStreet1}
                  validate={hasSubmittedOnce}
                  error={errors?.street1}
                />
                <Field isLoading={isLoading} field={"street2"} onChange={setStreet2} />
                <Field
                  isLoading={isLoading}
                  field={"city"}
                  onChange={setCity}
                  validate={hasSubmittedOnce}
                  error={errors?.city}
                />
                <LText style={styles.label} color={"smoke"}>
                  <Trans i18nKey={"transfer.swap.kyc.wyre.form.state"} />
                </LText>
                <TouchableOpacity onPress={onSelectState}>
                  <LText
                    style={[
                      styles.input,
                      {
                        color: state ? color : borderColor,
                        borderColor: hasSubmittedOnce && errors?.state ? colors.alert : borderColor,
                      },
                    ]}
                  >
                    {state?.value || t("transfer.swap.kyc.wyre.form.statePlaceholder")}
                  </LText>
                </TouchableOpacity>
                <LText color={"alert"}>
                  {errors?.state && hasSubmittedOnce ? (
                    <Trans i18nKey={`transfer.swap.kyc.wyre.form.stateError`} />
                  ) : null}
                </LText>
                <LText style={styles.label} color={"smoke"}>
                  <Trans i18nKey={"transfer.swap.kyc.wyre.form.country"} />
                </LText>
                <LText style={[styles.input, { color, borderColor }]}>{country?.label}</LText>
                <Field
                  isLoading={isLoading}
                  field={"postalCode"}
                  onChange={setPostalCode}
                  validate={hasSubmittedOnce}
                  error={errors?.postalCode}
                />
              </View>
            </ScrollView>
            <View style={styles.footer}>
              <Button
                type={"primary"}
                pending={isLoading}
                onPress={onSubmit}
                title={<Trans i18nKey={"transfer.swap.kyc.cta"} />}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wrapper: {
    padding: 16,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    lineHeight: 21,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  scroll: {},
  footer: {
    padding: 16,
  },
  disclaimer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
    minHeight: 52,
    borderRadius: 4,
    padding: 16,
    fontSize: 14,
    flex: 1,
  },
});
