import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import { InfoState } from "@shared/ui-info-state";
import { BottomSheetInfoGradient } from "LLM/components/BottomSheetGradient";
import { useAleoEstimatedTimeViewModel } from "./hooks/useAleoEstimatedTimeViewModel";

type Props = Readonly<{
  account: Account;
  transaction: Transaction;
}>;

function EstimatedTimeRow({ transaction }: Readonly<{ transaction: AleoTransaction }>) {
  const { label, value, info } = useAleoEstimatedTimeViewModel(transaction);
  const infoBottomSheetRef = useBottomSheetRef();
  const styles = useStyleSheet(
    theme => ({
      row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
      <View style={styles.row} testID="send-estimated-time-row">
        <Pressable
          onPress={handleOpenInfo}
          style={styles.labelSection}
          accessibilityRole="button"
          accessibilityLabel={info.title}
          testID="send-estimated-time-info-button"
        >
          <Text typography="body3" lx={{ color: "base" }}>
            {label}
          </Text>
          <Information size={16} lx={{ color: "muted" }} />
        </Pressable>
        <Text typography="body3" lx={{ color: "base" }} testID="send-estimated-time-value">
          {value}
        </Text>
      </View>

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

export default function SendAmountFooterRow({ transaction }: Props) {
  if (transaction.family !== "aleo") return null;
  return <EstimatedTimeRow transaction={transaction} />;
}
