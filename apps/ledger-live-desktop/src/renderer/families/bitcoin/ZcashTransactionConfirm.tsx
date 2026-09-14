import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/types-devices";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Unit } from "@domain/entity-currency-unit";
import { useFeature } from "@features/platform-feature-flags";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getProductName } from "LLD/utils/getProductName";
import FormattedVal from "~/renderer/components/FormattedVal";

type Props = Readonly<{
  device: Device | null | undefined;
  transaction: Transaction;
  unit: Unit;
  currencyId: string;
  onShown?: () => void;
  /** Rendered instead when this currency isn't Zcash, or the zcashShielded flag is off. */
  fallback: React.ReactNode;
}>;

function isShieldedRecipient(recipient: string): boolean {
  return recipient.startsWith("u1");
}

export function ZcashTransactionConfirm({
  device,
  transaction,
  unit,
  currencyId,
  onShown,
  fallback,
}: Props) {
  const { t } = useTranslation();
  const type = useTheme().theme;
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const applies = currencyId === "zcash" && shieldedEnabled;

  const hasTrackedRef = useRef(false);
  if (applies && device && !hasTrackedRef.current) {
    hasTrackedRef.current = true;
    onShown?.();
  }

  if (!applies) return <>{fallback}</>;
  if (!device) return null;

  const shielded = isShieldedRecipient(transaction.recipient);

  return (
    <div
      className="flex flex-col items-center gap-24 px-24 pb-16 text-center"
      data-testid="send-signature-prompt"
    >
      <DeviceBlocker />
      <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
      <h2 className="heading-3-semi-bold text-base" data-testid="send-signature-title">
        {t("newSendFlow.sign.title", { wording: getProductName(device.modelId) })}
      </h2>
      {shielded ? (
        <>
          <p className="body-2 text-muted" data-testid="zcash-private-transaction-label">
            {t("zcash.shielded.send.confirm.privateTransaction")}
          </p>
          <div data-testid="zcash-confirm-amount">
            <FormattedVal val={transaction.amount} unit={unit} showCode />
          </div>
        </>
      ) : (
        <>
          <p className="body-2 text-muted">{t("newSendFlow.sign.description")}</p>
          <p
            className="body-2 break-all font-mono text-muted"
            data-testid="zcash-confirm-transparent-address"
          >
            {transaction.recipient}
          </p>
        </>
      )}
    </div>
  );
}
