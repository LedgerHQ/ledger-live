import React from "react";
import { useTranslation } from "react-i18next";
import { AmountInput, Banner, Button, Spinner, Tag } from "@ledgerhq/lumen-ui-react";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import {
  useShieldModalViewModel,
  type ShieldModalViewModel,
  type ShieldPhaseStatus,
} from "./useShieldModalViewModel";

const PHASE_TAG: Record<ShieldPhaseStatus, "gray" | "accent" | "success" | "error"> = {
  pending: "gray",
  signing: "accent",
  confirming: "accent",
  done: "success",
  failed: "error",
};

export function ShieldModalView({
  screen,
  input,
  maxDecimals,
  ticker,
  wrapper,
  publicLabel,
  amountError,
  canSubmit,
  isPreparing,
  isRunning,
  phases,
  error,
  shieldedLabel,
  remainderLabel,
  onChangeInput,
  onMax,
  onSubmit,
  onRetry,
  onClose,
}: ShieldModalViewModel) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpened
      onClose={isRunning ? undefined : onClose}
      centered
      width={500}
      backdropColor
      data-testid="confidential-shield-modal"
    >
      <ModalBody
        title={t("confidentialBalance.shield.title", { ticker })}
        onClose={isRunning ? undefined : onClose}
        render={() => (
          <div className="flex flex-col gap-16 p-24">
            {screen === "amount" && (
              <>
                <span className="body-2 text-muted">
                  {t("confidentialBalance.shield.description", { ticker, wrapper })}
                </span>
                <AmountInput
                  value={input}
                  onChange={event => onChangeInput(event.target.value)}
                  currencyText={ticker}
                  currencyPosition="right"
                  placeholder="0"
                  maxDecimalLength={maxDecimals}
                  aria-invalid={amountError !== null}
                  data-testid="confidential-shield-amount"
                />
                <div className="flex flex-row items-center justify-between">
                  <span className="body-3 text-muted" data-testid="confidential-shield-available">
                    {t("confidentialBalance.shield.available", { amount: publicLabel })}
                  </span>
                  <Button appearance="gray" size="sm" onClick={onMax}>
                    {t("confidentialBalance.shield.max")}
                  </Button>
                </div>
                {amountError && (
                  <span
                    className="body-3 text-error"
                    data-testid="confidential-shield-amount-error"
                  >
                    {t(`confidentialBalance.shield.amountErrors.${amountError}`)}
                  </span>
                )}
                <Button
                  appearance="accent"
                  disabled={!canSubmit}
                  loading={isPreparing}
                  onClick={onSubmit}
                  data-testid="confidential-shield-submit"
                >
                  {t("confidentialBalance.shield.submit")}
                </Button>
              </>
            )}

            {screen !== "amount" && (
              <ol className="flex flex-col gap-12" data-testid="confidential-shield-phases">
                {phases.map(({ step, status, hash }) => (
                  <li
                    key={step}
                    className="flex flex-row items-center gap-12"
                    data-testid={`confidential-shield-phase-${step}`}
                  >
                    {status === "signing" || status === "confirming" ? <Spinner size={16} /> : null}
                    <div className="flex flex-col gap-2">
                      <span className="body-2-semi-bold text-base">
                        {t(`confidentialBalance.shield.steps.${step}`, { ticker, wrapper })}
                      </span>
                      {hash && <span className="body-3 text-muted">{hash}</span>}
                    </div>
                    <div className="ml-auto">
                      <Tag
                        appearance={PHASE_TAG[status]}
                        size="sm"
                        label={t(`confidentialBalance.shield.status.${status}`)}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {screen === "done" && (
              <Banner
                appearance="success"
                title={t("confidentialBalance.shield.done", { amount: shieldedLabel })}
                description={
                  remainderLabel
                    ? t("confidentialBalance.shield.remainder", { amount: remainderLabel })
                    : t("confidentialBalance.shield.revealAgain")
                }
                data-testid="confidential-shield-done"
              />
            )}

            {error && (
              <Banner
                appearance="error"
                title={t(`confidentialBalance.errors.${error}`)}
                primaryAction={
                  <Button appearance="transparent" size="sm" onClick={onRetry}>
                    {t("confidentialBalance.retry")}
                  </Button>
                }
                data-testid={`confidential-shield-error-${error}`}
              />
            )}

            {screen === "done" && (
              <Button appearance="accent" onClick={onClose} data-testid="confidential-shield-close">
                {t("confidentialBalance.shield.close")}
              </Button>
            )}
          </div>
        )}
      />
    </Modal>
  );
}

type Props = Parameters<typeof useShieldModalViewModel>[0];

export function ShieldModal(props: Props) {
  return <ShieldModalView {...useShieldModalViewModel(props)} />;
}
