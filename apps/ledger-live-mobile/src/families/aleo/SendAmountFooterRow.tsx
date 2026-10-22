import React, { useCallback } from "react";
import { Pressable } from "react-native";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import { InfoState } from "@shared/ui-info-state";
import { BottomSheetInfoGradient } from "LLM/components/BottomSheetGradient";
import {
  useAleoEstimatedTimeViewModel,
  type AleoEstimatedTimeViewModel,
} from "./hooks/useAleoEstimatedTimeViewModel";

type Props = Readonly<{
  account: Account;
  transaction: Transaction;
}>;

type EstimatedTimeRowProps = Readonly<{
  viewModel: NonNullable<AleoEstimatedTimeViewModel>;
}>;

function EstimatedTimeRow({ viewModel }: EstimatedTimeRowProps) {
  const { label, value, info } = viewModel;
  const infoBottomSheetRef = useBottomSheetRef();
  const styles = useStyleSheet(
    theme => ({
      row: {
        alignItems: "center",
        paddingVertical: theme.spacings.s12,
        marginBottom: theme.spacings.s8,
      },
      labelSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s4,
      },
    }),
    [],
  );

  const handleOpenInfo = useCallback(() => {
    infoBottomSheetRef.current?.present();
  }, [infoBottomSheetRef]);

  const handleCloseInfo = useCallback(() => {
    infoBottomSheetRef.current?.dismiss();
  }, [infoBottomSheetRef]);

  return (
    <>
      <DescriptionItem size="sm" style={styles.row} testID="send-estimated-time-row">
        <DescriptionItemLeading>
          <Pressable
            onPress={handleOpenInfo}
            style={styles.labelSection}
            accessibilityRole="button"
            accessibilityLabel={info.title}
            testID="send-estimated-time-info-button"
          >
            <DescriptionItemLabel>{label}</DescriptionItemLabel>
            <Information size={16} lx={{ color: "muted" }} />
          </Pressable>
        </DescriptionItemLeading>
        <DescriptionItemTrailing>
          <DescriptionItemValue testID="send-estimated-time-value">{value}</DescriptionItemValue>
        </DescriptionItemTrailing>
      </DescriptionItem>

      <BottomSheet
        ref={infoBottomSheetRef}
        enableDynamicSizing
        snapPoints={null}
        backgroundComponent={BottomSheetInfoGradient}
      >
        <BottomSheetView>
          <BottomSheetHeader density="compact" />
          <InfoState
            preset="info"
            size="hug"
            title={info.title}
            description={info.description}
            primaryCta={{ label: info.confirmLabel, onPress: handleCloseInfo }}
            secondaryCta={{
              label: info.learnMoreLabel,
              onPress: info.onLearnMore,
              testID: "send-estimated-time-learn-more",
            }}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

function AleoSendAmountFooterRow({
  account,
  transaction,
}: Readonly<{ account: Account; transaction: AleoTransaction }>) {
  const viewModel = useAleoEstimatedTimeViewModel(account, transaction);
  if (!viewModel) return null;
  return <EstimatedTimeRow viewModel={viewModel} />;
}

export default function SendAmountFooterRow({ account, transaction }: Props) {
  if (transaction.family !== "aleo") return null;
  return <AleoSendAmountFooterRow account={account} transaction={transaction} />;
}
