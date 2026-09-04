import type { TransactionStatus } from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  status: TransactionStatus;
  bridgePending: boolean;
  onContinue: () => void;
  /** Extra condition beyond the bridge's own validation, for input the bridge cannot see yet. */
  canContinue?: boolean;
  /**
   * The status field this screen's own input drives, named only while that input is still empty.
   *
   * Every one of these screens arrives with its field blank, which the bridge rightly rejects — but
   * faulting a field nobody has typed in yet reads as the screen having failed on arrival. The error
   * it names is withheld until there is an entry to fault; anything else is reported at once, since
   * no amount of typing in this field will fix it. Continue stays disabled either way.
   */
  pristineField?: "amount" | "transaction";
}>;

/**
 * Footer shared by every screen that collects input before signing. Continue is gated on the
 * bridge's transaction status, so each screen only has to keep the transaction up to date.
 */
export default function ActionFooter({
  status,
  bridgePending,
  onContinue,
  canContinue = true,
  pristineField,
}: Props) {
  const { t } = useTranslation();
  const errors = Object.entries(status.errors);
  // Blocking is measured over every error, including one this footer chooses not to report: the
  // entry is still invalid whether or not saying so yet would help.
  const blocking = errors.length > 0;
  const reported = errors.find(([field]) => field !== pristineField)?.[1];
  // The bridge files staking notices under `warnings.staking`, a slot nothing has ever read: the
  // generic send flow renders `warnings.amount` and `warnings.transaction` only. This is the family's
  // own footer, so it is where a notice raised on every stake and every top-up can reach the user.
  const staking = status.warnings.staking;

  return (
    <Flex p={6} style={{ gap: 12 }}>
      {staking ? (
        <Flex style={{ gap: 4 }}>
          <Text variant="body" fontWeight="semiBold" color="warning.c70">
            <TranslatedError error={staking} />
          </Text>
          <Text variant="small" color="warning.c70">
            <TranslatedError error={staking} field="description" />
          </Text>
        </Flex>
      ) : null}
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
