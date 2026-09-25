import React from "react";
import {
  AmountInput,
  Button,
  DialogBody,
  DialogFooter,
  DialogHeader,
  IconButton,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo, TransferVertical } from "@ledgerhq/lumen-ui-react/symbols";
import { Trans, useTranslation } from "@shared/i18n";
import type { CardTopUpAmountViewProps } from "../../types";

export function CardTopUpAmountView({
  title,
  headerDescription,
  amountText,
  currencyText,
  currencyPosition,
  maxDecimalLength,
  secondaryValue,
  canToggleInputMode,
  amountError,
  ratios,
  canSubmit,
  onAmountChange,
  onToggleInputMode,
  onSubmit,
  onOpenLegal,
  onClose,
}: CardTopUpAmountViewProps) {
  const { t } = useTranslation();
  const legalLink = (
    // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- Trans fills in the link text
    <button
      type="button"
      className="inline cursor-pointer border-0 bg-transparent p-0 body-4 text-muted underline"
      onClick={onOpenLegal}
    />
  );

  return (
    <>
      <DialogHeader
        density="compact"
        title={title}
        description={headerDescription}
        onClose={onClose}
      />
      <DialogBody className="flex flex-col items-center gap-40 py-24">
        <div className="flex w-full flex-col items-center gap-8">
          <div className="relative flex w-full items-center justify-center px-40">
            <AmountInput
              value={amountText}
              onChange={event => onAmountChange(event.target.value)}
              currencyText={currencyText}
              currencyPosition={currencyPosition}
              maxDecimalLength={maxDecimalLength}
              aria-invalid={amountError !== null}
              autoFocus
              data-testid="card-top-up-amount-input"
            />
            {canToggleInputMode ? (
              <IconButton
                icon={TransferVertical}
                size="xs"
                appearance="gray"
                aria-label={t("payTab.cardTopUp.toggleInputMode")}
                className="absolute right-0 top-1/2 -translate-y-1/2"
                onClick={onToggleInputMode}
                data-testid="card-top-up-toggle-input-mode"
              />
            ) : null}
          </div>
          {secondaryValue ? (
            <p className="body-2 text-muted" data-testid="card-top-up-secondary-value">
              {secondaryValue}
            </p>
          ) : null}
          {amountError ? (
            <p className="body-3 text-error" data-testid="card-top-up-amount-error">
              {amountError}
            </p>
          ) : null}
        </div>
        <div className="flex w-full justify-center gap-16">
          {ratios.map(ratio => (
            <Button
              key={ratio.id}
              appearance="gray"
              size="sm"
              disabled={ratio.disabled}
              onClick={ratio.onSelect}
              data-testid={`card-top-up-ratio-${ratio.id}`}
            >
              {ratio.label}
            </Button>
          ))}
        </div>
      </DialogBody>
      <DialogFooter className="flex flex-col gap-12 pt-48">
        <Button
          appearance="base"
          size="lg"
          isFull
          icon={LedgerLogo}
          disabled={!canSubmit}
          onClick={onSubmit}
          data-testid="card-top-up-submit"
        >
          {t("payTab.cardTopUp.review")}
        </Button>
        <p className="text-center body-4 text-muted">
          <Trans
            i18nKey="payTab.cardTopUp.disclaimer"
            components={{ termsLink: legalLink, privacyLink: legalLink }}
          />
        </p>
      </DialogFooter>
    </>
  );
}
