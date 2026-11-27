import React from "react";
import { Pressable } from "react-native";
import {
  Box,
  Divider,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Check, ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { FeeSelectorOption } from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";

type Props = Readonly<{
  amountLabel: string;
  amount: string | null;
  totalLabel: string;
  total: string | null;
  feeOptions: readonly FeeSelectorOption[];
  error: string | null;
}>;

function FeeOptionRow({ option }: Readonly<{ option: FeeSelectorOption }>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: option.selected }}
      onPress={option.onSelect}
      testID={`wallet-api-fee-option-${option.id}`}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: "s10",
          gap: "s16",
        }}
      >
        <Box lx={{ flex: 1, gap: "s4" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            {option.label}
          </Text>
          {option.sublabel ? (
            <Text typography="body3" lx={{ color: "muted" }}>
              {option.sublabel}
            </Text>
          ) : null}
        </Box>
        {option.selected ? <Check size={20} /> : null}
        {!option.selected && option.kind === "custom" ? (
          <ChevronRight size={20} lx={{ color: "muted" }} />
        ) : null}
      </Box>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  testID,
}: Readonly<{ label: string; value: string; testID: string }>) {
  return (
    <DescriptionItem size="sm">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue testID={testID}>{value}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}

export function FeeSelectionStepView({
  amountLabel,
  amount,
  totalLabel,
  total,
  feeOptions,
  error,
}: Props) {
  return (
    <Box lx={{ gap: "s16" }} testID="wallet-api-fee-step">
      {amount ? (
        <SummaryRow label={amountLabel} value={amount} testID="wallet-api-fee-step-amount" />
      ) : null}
      <Box>
        {feeOptions.map(option => (
          <FeeOptionRow key={option.id} option={option} />
        ))}
      </Box>
      {total ? (
        <>
          <Divider />
          <SummaryRow label={totalLabel} value={total} testID="wallet-api-fee-step-total" />
        </>
      ) : null}
      {error ? (
        <Text typography="body3" lx={{ color: "error" }} testID="wallet-api-fee-step-error">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}
