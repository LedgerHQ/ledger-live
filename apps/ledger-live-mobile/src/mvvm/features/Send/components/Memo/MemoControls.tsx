import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { MemoTypeSelect } from "./MemoTypeSelect";
import { MemoValueInput } from "./MemoValueInput";
import { SkipMemoSection } from "./SkipMemoSection";
import type { useMemoViewModel } from "./hooks/useMemoViewModel";

type MemoControlsProps = Readonly<{
  vm: ReturnType<typeof useMemoViewModel>;
}>;

export function MemoControls({ vm }: MemoControlsProps) {
  const styles = useStyleSheet(
    theme => ({
      root: {
        marginTop: -theme.spacings.s12,
        marginBottom: theme.spacings.s24,
        gap: theme.spacings.s12,
        paddingHorizontal: theme.spacings.s8,
      },
    }),
    [],
  );

  return (
    <Box style={styles.root}>
      {vm.hasMemoTypeOptions && (
        <MemoTypeSelect
          currencyId={vm.currencyId}
          options={vm.memoTypeOptions}
          value={vm.memo.type}
          onChange={vm.onMemoTypeChange}
        />
      )}

      {vm.showMemoValueInput && (
        <MemoValueInput
          currencyId={vm.currencyId}
          memoLabel={vm.memoLabel}
          value={vm.memo.value}
          maxLength={vm.uiConfig.memoMaxLength}
          memoType={vm.uiConfig.memoType}
          memoMaxValue={vm.uiConfig.memoMaxValue}
          transactionError={vm.memoError}
          onChange={vm.onMemoValueChange}
        />
      )}

      {vm.showSkipMemo && (
        <SkipMemoSection
          memoLabel={vm.memoLabel}
          state={vm.skipMemoState}
          onRequestConfirm={vm.onSkipMemoRequestConfirm}
          onConfirm={vm.onSkipMemoConfirm}
        />
      )}
    </Box>
  );
}
