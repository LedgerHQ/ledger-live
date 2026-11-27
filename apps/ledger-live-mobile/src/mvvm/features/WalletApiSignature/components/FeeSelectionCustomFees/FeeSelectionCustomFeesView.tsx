import React, { useRef } from "react";
import type { TextInput as NativeTextInput } from "react-native";
import { Box, Button, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { useBottomSheetKeyboardAwareInput } from "@shared/ui-queued-bottom-sheet/keyboard";
import type {
  CustomFeeInputState,
  FeeAssetUiOption,
} from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import { FeeAssetSelector } from "LLM/features/Send/screens/CustomFees/components/FeeAssetSelector";

type Props = Readonly<{
  inputs: readonly CustomFeeInputState[];
  fiatLabel: string | null;
  fiatValue: string | null;
  isConfirmDisabled: boolean;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
  onConfirm: () => void;
  hasCustomAssets: boolean;
  assetOptions: readonly FeeAssetUiOption[];
  selectedAssetId: string;
  onAssetChange: (id: string) => void;
  confirmLabel: string;
  suggestedLabel: string;
  payFeesInLabel: string;
}>;

function DescriptionRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body3SemiBold" lx={{ color: "base" }}>
        {value}
      </Text>
    </Box>
  );
}

type CustomFeeInputProps = Readonly<{
  input: CustomFeeInputState;
  suggestedLabel: string;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
}>;

function CustomFeeInput({
  input,
  suggestedLabel,
  onInputChange,
  onInputClear,
}: CustomFeeInputProps) {
  const inputRef = useRef<NativeTextInput>(null);
  const keyboardAwareProps = useBottomSheetKeyboardAwareInput(inputRef);

  return (
    <Box lx={{ gap: "s8" }}>
      <TextInput
        ref={inputRef}
        {...keyboardAwareProps}
        label={input.label}
        value={input.value}
        onChangeText={value => onInputChange(input.key, value)}
        onClear={() => onInputClear(input.key)}
        helperText={input.error ?? undefined}
        status={input.error ? "error" : undefined}
        keyboardType="decimal-pad"
        autoComplete="off"
        testID={`wallet-api-custom-fee-input-${input.key}`}
      />
      {input.suggestedRange ? (
        <DescriptionRow
          label={suggestedLabel}
          value={`${input.suggestedRange.min}-${input.suggestedRange.max}`}
        />
      ) : null}
      {input.helperLabel && input.helperValue !== null ? (
        <DescriptionRow label={input.helperLabel} value={input.helperValue} />
      ) : null}
    </Box>
  );
}

export function FeeSelectionCustomFeesView({
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
}: Props) {
  return (
    <Box lx={{ gap: "s24" }} testID="wallet-api-custom-fees">
      {hasCustomAssets && assetOptions.length > 0 ? (
        <FeeAssetSelector
          options={assetOptions}
          selectedId={selectedAssetId}
          onChange={onAssetChange}
          payFeesInLabel={payFeesInLabel}
        />
      ) : null}
      {inputs.map(input => (
        <CustomFeeInput
          key={input.key}
          input={input}
          suggestedLabel={suggestedLabel}
          onInputChange={onInputChange}
          onInputClear={onInputClear}
        />
      ))}
      {fiatLabel ? <DescriptionRow label={fiatLabel} value={fiatValue ?? "—"} /> : null}
      <Button
        appearance="base"
        size="lg"
        onPress={onConfirm}
        disabled={isConfirmDisabled}
        testID="wallet-api-custom-fees-confirm"
      >
        {confirmLabel}
      </Button>
    </Box>
  );
}
