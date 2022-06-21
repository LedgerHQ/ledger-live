import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import LText from "../../../components/LText";
import { providerIcons } from "../../../icons/providers";

interface Props {
  provider?: string;
}

export function FormSummary({ provider }: Props) {
  const { t } = useTranslation();
  const ProviderIcon = provider && providerIcons[provider.toLowerCase()];

  return (
    <Section label={t("transfer.swap.form.summary.provider")}>
      {ProviderIcon ? <ProviderIcon size={12} /> : null}
      <LText semiBold style={[styles.valueLabel, styles.providerLabel]}>
        {provider}
      </LText>
    </Section>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  label: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  tooltipText: { fontSize: 14, lineHeight: 20, marginRight: 4 },
  value: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  editText: { fontSize: 12, margin: 0 },
  editButton: { paddingLeft: 8, paddingVertical: 4 },
});
