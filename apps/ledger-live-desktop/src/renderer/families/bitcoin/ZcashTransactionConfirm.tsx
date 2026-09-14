import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/types-devices";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getProductName } from "LLD/utils/getProductName";
import FormattedVal from "~/renderer/components/FormattedVal";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";

type Props = Readonly<{
  device: Device | null | undefined;
  transaction: unknown;
  unit: Unit;
  onShown?: () => void;
}>;

function isShieldedRecipient(recipient: string | undefined): boolean {
  return typeof recipient === "string" && recipient.startsWith("u1");
}

export function ZcashTransactionConfirm({ device, transaction, unit, onShown }: Props) {
  const { t } = useTranslation();
  const type = useTheme().theme;

  const hasTrackedRef = useRef(false);
  if (device && !hasTrackedRef.current) {
    hasTrackedRef.current = true;
    onShown?.();
  }

  if (!device) return null;

  const recipient = (transaction as { recipient?: string } | null | undefined)?.recipient;
  const amount: BigNumber =
    (transaction as { amount?: BigNumber } | null | undefined)?.amount ?? new BigNumber(0);
  const shielded = isShieldedRecipient(recipient);

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
            <FormattedVal val={amount} unit={unit} showCode />
          </div>
        </>
      ) : (
        <>
          <p className="body-2 text-muted">{t("newSendFlow.sign.description")}</p>
          {recipient && (
            <p
              className="body-2 break-all font-mono text-muted"
              data-testid="zcash-confirm-transparent-address"
            >
              {recipient}
            </p>
          )}
        </>
      )}
    </div>
  );
}
