import React, { useCallback } from "react";
import { Linking, Pressable } from "react-native";
import { log } from "@ledgerhq/logs";
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
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import {
  getEstimatedSigningTime,
  getSigningRecordCount,
  isAleoTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import { InfoState } from "@shared/ui-info-state";
import { BottomSheetInfoGradient } from "LLM/components/BottomSheetGradient";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import type { AmountFooterRowProps } from "~/screens/SendFunds/utils/customSendFlow";

export function SendAmountFooterRow({ account, transaction }: Readonly<AmountFooterRowProps>) {
  const { t } = useTranslation();
  const infoBottomSheetRef = useBottomSheetRef();
  const learnMoreUrl = useLocalizedUrl(urls.aleo.learnMore);
  const styles = useStyleSheet(
    theme => ({
      row: {
        alignItems: "center",
        paddingBottom: theme.spacings.s16,
      },
      infoTrigger: {
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

  const handleLearnMore = useCallback(() => {
    Linking.openURL(learnMoreUrl).catch(error => {
      log("aleo-send-estimated-time", "Failed to open learn more URL", {
        error,
        url: learnMoreUrl,
      });
    });
  }, [learnMoreUrl]);

  const isAutoPickingStrategy =
    getAleoCurrencyConfigById(account.currency.id)?.recordPickingStrategy === "auto";
  if (!isAutoPickingStrategy || !isAleoTransaction(transaction)) return null;

  const recordCount = getSigningRecordCount(transaction);
  if (recordCount === 0) return null;

  const estimatedTime = getEstimatedSigningTime(
    recordCount,
    t("time.second_short"),
    t("time.minute_short"),
  );

  return (
    <>
      <DescriptionItem size="sm" style={styles.row} testID="aleo-send-estimated-time-row">
        <DescriptionItemLeading>
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenInfo}
            style={styles.infoTrigger}
            testID="aleo-send-estimated-time-info"
          >
            <DescriptionItemLabel>{t("aleo.send.amount.estimatedTime.label")}</DescriptionItemLabel>
            <Information size={16} lx={{ color: "muted" }} />
          </Pressable>
        </DescriptionItemLeading>
        <DescriptionItemTrailing>
          <DescriptionItemValue testID="aleo-send-estimated-time-value">
            {estimatedTime}
          </DescriptionItemValue>
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
            title={t("aleo.send.amount.estimatedTime.info.title")}
            description={t("aleo.send.amount.estimatedTime.info.description")}
            primaryCta={{ label: t("common.gotit"), onPress: handleCloseInfo }}
            secondaryCta={{ label: t("common.learnMore"), onPress: handleLearnMore }}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
