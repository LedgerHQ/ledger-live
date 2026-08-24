import type { TransactionStatus } from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";

type Props = {
  status: TransactionStatus;
  bridgePending: boolean;
  onContinue: () => void;
  /** Extra condition beyond the bridge's own validation, for input the bridge cannot see yet. */
  canContinue?: boolean;
  /**
   * Set false while the amount is still untouched. The bridge rejects a zero amount, but faulting a
   * field nobody has typed in yet reads as the screen having gone wrong on arrival. Continue stays
   * disabled either way, and non-amount errors are still reported.
   */
  showAmountError?: boolean;
};

/**
 * Footer shared by every screen that collects input before signing. Continue is gated on the
 * bridge's transaction status, so each screen only has to keep the transaction up to date.
 */
export default function ActionFooter({
  status,
  bridgePending,
  onContinue,
  canContinue = true,
  showAmountError = true,
}: Props) {
  const { t } = useTranslation();
  const errors = Object.entries(status.errors);
  // Blocking is measured over every error, including one this footer chooses not to report: the
  // amount is still invalid whether or not saying so yet would help.
  const blocking = errors.length > 0;
  const reported = errors.find(([field]) => showAmountError || field !== "amount")?.[1];

  return (
    <Flex p={6} style={{ gap: 12 }}>
      {reported ? (
        <Flex style={{ gap: 4 }}>
          {/* Translated rather than `error.message`: every ICP error class defaults its message to
              its own name, so the raw message renders as "ICPInvalidPercentage" at the user. */}
          <Text variant="body" fontWeight="semiBold" color="error.c50">
            <TranslatedError error={reported} />
          </Text>
          <Text variant="small" color="error.c50">
            <TranslatedError error={reported} field="description" />
          </Text>
        </Flex>
      ) : null}
      <Button
        type="main"
        disabled={bridgePending || blocking || !canContinue}
        onPress={onContinue}
        testID="icp-continue-button"
      >
        {t("common.continue")}
      </Button>
    </Flex>
  );
}
