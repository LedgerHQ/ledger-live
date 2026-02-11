import React from "react";
import { TextInput, Button, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";
import type { FeeAssetOption } from "@ledgerhq/live-common/bridge/descriptor";
import type { CustomFeeInputState } from "../hooks/useCustomFeesViewModel";
import { FeeAssetSelector } from "./FeeAssetSelector";

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
    <>
      <DialogBody className="gap-32 py-12">
        {hasCustomAssets && assetOptions.length > 0 && (
          <FeeAssetSelector
            options={assetOptions}
            selectedId={selectedAssetId}
            onChange={onAssetChange}
            payFeesInLabel={payFeesInLabel}
          />
        )}

        {inputs.map(input => (
          <div key={input.key} className="flex flex-col gap-8">
            <TextInput
              label={input.label}
              value={input.value}
              onChange={e => onInputChange(input.key, e.target.value)}
              onClear={() => onInputClear(input.key)}
              aria-invalid={input.error !== null}
              errorMessage={input.error ?? undefined}
              inputMode="decimal"
              autoComplete="off"
            />
            {input.suggestedRange && (
              <div className="flex items-center justify-between px-4">
                <span className="body-3 text-muted">{suggestedLabel}</span>
                <span className="body-3 text-base">
                  {input.suggestedRange.min}-{input.suggestedRange.max}
                </span>
              </div>
            )}
            {input.helperLabel && input.helperValue && (
              <div className="flex items-center justify-between px-4">
                <span className="body-3 text-muted">{input.helperLabel}</span>
                <span className="body-3 text-base">{input.helperValue}</span>
              </div>
            )}
          </div>
        ))}

        {fiatLabel && fiatValue && (
          <div className="flex items-center justify-between px-4">
            <span className="body-3 text-muted">{fiatLabel}</span>
            <span className="body-3 text-base">{fiatValue}</span>
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        <Button appearance="base" size="lg" isFull onClick={onConfirm} disabled={isConfirmDisabled}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
