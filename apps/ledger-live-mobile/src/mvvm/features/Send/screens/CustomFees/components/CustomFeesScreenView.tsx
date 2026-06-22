import React from "react";
import { Box, Button, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { FeeAssetOption } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { CustomFeeInputState } from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import { SendFlowLayout } from "../../../components/SendFlowLayout";
import { FeeAssetSelector } from "./FeeAssetSelector";

type DescriptionRowProps = Readonly<{
  label: string;
  value: string;
}>;

function DescriptionRow({ label, value }: DescriptionRowProps) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body3SemiBold" lx={{ color: "base" }}>
        {value}
      </Text>
    </Box>
  );
}

type CustomFeesScreenViewProps = Readonly<{
  inputs: readonly CustomFeeInputState[];
  fiatLabel: string | null;
  fiatValue: string | null;
  isConfirmDisabled: boolean;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
  onConfirm: () => void;
  hasCustomAssets: boolean;
  assetOptions: readonly FeeAssetOption[];
  selectedAssetId: string;
  onAssetChange: (id: string) => void;
  confirmLabel: string;
  suggestedLabel: string;
  payFeesInLabel: string;
}>;

export function CustomFeesScreenView({
  inputs,
  fiatLabel,
  fiatValue,
  isConfirmDisabled,
  onInputChange,
  onInputClear,
  onConfirm,
  hasCustomAssets,
  assetOptions,
  selectedAssetId,
  onAssetChange,
  confirmLabel,
  suggestedLabel,
  payFeesInLabel,
}: CustomFeesScreenViewProps) {
  return (
    <SendFlowLayout>
      <Box lx={{ flex: 1 }}>
        <Box lx={{ gap: "s24" }}>
          {hasCustomAssets && assetOptions.length > 0 && (
            <FeeAssetSelector
              options={assetOptions}
              selectedId={selectedAssetId}
              onChange={onAssetChange}
              payFeesInLabel={payFeesInLabel}
            />
          )}

          {inputs.map(input => (
            <Box key={input.key} lx={{ gap: "s8" }}>
              <TextInput
                label={input.label}
                value={input.value}
                onChangeText={value => onInputChange(input.key, value)}
                onClear={() => onInputClear(input.key)}
                helperText={input.error ?? undefined}
                status={input.error ? "error" : undefined}
                keyboardType="decimal-pad"
                autoComplete="off"
              />
              {input.suggestedRange && (
                <DescriptionRow
                  label={suggestedLabel}
                  value={`${input.suggestedRange.min}-${input.suggestedRange.max}`}
                />
              )}
              {input.helperLabel && input.helperValue !== null && (
                <DescriptionRow label={input.helperLabel} value={input.helperValue} />
              )}
            </Box>
          ))}

          {fiatLabel && <DescriptionRow label={fiatLabel} value={fiatValue ?? "—"} />}
        </Box>

        <Box lx={{ flex: 1 }} />

        <Button appearance="base" size="lg" onPress={onConfirm} disabled={isConfirmDisabled}>
          {confirmLabel}
        </Button>
      </Box>
    </SendFlowLayout>
  );
}
