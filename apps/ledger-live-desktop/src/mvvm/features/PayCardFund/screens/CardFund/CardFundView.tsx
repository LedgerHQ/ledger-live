import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import {
  AmountInput,
  Button,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderError, renderLoading } from "~/renderer/components/DeviceAction/rendering";
import type { CardFundViewModel } from "./types";

const KEY_PREFIX = "payTab.card.fund";

export function CardFundView({
  asset,
  amountText,
  maxDecimalLength,
  availableBalance,
  sourceAccountName,
  amountError,
  canSubmit,
  deviceStep,
  onAmountChange,
  onSubmit,
  onRetry,
  onDeviceError,
  onClose,
}: CardFundViewModel) {
  const { t } = useTranslation();

  if (deviceStep.kind === "error") {
    return renderError({ error: deviceStep.error, t, onRetry });
  }

  if (deviceStep.kind === "processing") {
    return renderLoading();
  }

  if (deviceStep.kind === "device") {
    return (
      <>
        <DialogTitle className="sr-only">{t(`${KEY_PREFIX}.deviceTitle`)}</DialogTitle>
        <DialogBody className="flex w-full flex-col items-center gap-24 px-16 pb-24 pt-24">
          {deviceStep.withDeviceAction(({ action, request, onResult }) => (
            <DeviceAction
              key={deviceStep.stepId}
              action={action}
              request={request}
              onResult={onResult}
              onError={onDeviceError}
            />
          ))}
        </DialogBody>
      </>
    );
  }

  if (deviceStep.kind === "success") {
    return (
      <>
        <DialogHeader density="compact" title={t(`${KEY_PREFIX}.successTitle`)} onClose={onClose} />
        <DialogBody>
          <p className="body-2 text-muted">{t(`${KEY_PREFIX}.successDescription`)}</p>
        </DialogBody>
        <DialogFooter>
          <Button className="w-full" onClick={onClose}>
            {t(`${KEY_PREFIX}.done`)}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader
        density="compact"
        title={t(`${KEY_PREFIX}.title`, { asset: asset.name })}
        description={t(`${KEY_PREFIX}.source`, { account: sourceAccountName })}
        onClose={onClose}
      />
      <DialogBody className="flex flex-col gap-24">
        <div>
          <AmountInput
            value={amountText}
            onChange={event => onAmountChange(event.target.value)}
            currencyText={asset.ticker}
            maxDecimalLength={maxDecimalLength}
            aria-invalid={amountError !== null}
            data-testid="card-fund-amount-input"
          />
          <p className={`body-3 mt-8 ${amountError ? "text-error" : "text-muted"}`}>
            {amountError ?? t(`${KEY_PREFIX}.available`, { balance: availableBalance })}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="body-3 text-muted">{t(`${KEY_PREFIX}.destination`)}</p>
          <p className="body-2 break-all" data-testid="card-fund-destination">
            {asset.address}
          </p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={onSubmit}
          data-testid="card-fund-submit"
        >
          {t(`${KEY_PREFIX}.continue`)}
        </Button>
      </DialogFooter>
    </>
  );
}
