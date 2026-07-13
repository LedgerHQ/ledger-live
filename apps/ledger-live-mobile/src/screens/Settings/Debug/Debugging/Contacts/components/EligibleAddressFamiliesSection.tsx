import React from "react";
import { Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { ELIGIBLE_ADDRESS_FAMILIES_PRESETS } from "../constants";
import { EligibleAddressFamiliesSectionProps } from "../types";

const areFamiliesEqual = (left: readonly string[], right: readonly string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  const leftFamilies = new Set(left);
  return right.every(family => leftFamilies.has(family));
};

export const EligibleAddressFamiliesSection = ({
  isEnabled,
  families,
  onPresetSelect,
}: EligibleAddressFamiliesSectionProps) => (
  <Box lx={{ paddingVertical: "s16", paddingHorizontal: "s12" }}>
    <Text typography="body2" lx={{ color: "base", marginBottom: "s8" }}>
      Eligible address families
    </Text>
    <Text typography="body3" lx={{ color: "muted", marginBottom: "s12" }}>
      Current: {JSON.stringify(families)}
    </Text>
    <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
      {ELIGIBLE_ADDRESS_FAMILIES_PRESETS.map(preset => {
        const isSelected = areFamiliesEqual(families, preset.families);
        return (
          <Button
            key={preset.id}
            appearance={isSelected ? "accent" : "gray"}
            size="sm"
            onPress={() => onPresetSelect(preset.families)}
            disabled={!isEnabled}
            testID={`debug-contacts-families-preset-${preset.id}`}
          >
            {preset.label}
          </Button>
        );
      })}
    </Box>
  </Box>
);
