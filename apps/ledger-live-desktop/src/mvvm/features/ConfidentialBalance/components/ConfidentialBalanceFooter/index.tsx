import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button, Spinner, Tag } from "@ledgerhq/lumen-ui-react";
import type { TokenAccount } from "@ledgerhq/types-live";
import {
  useConfidentialBalanceFooterViewModel,
  type ConfidentialBalanceFooterViewModel,
} from "./useConfidentialBalanceFooterViewModel";

type BalanceColumnProps = Readonly<{
  title: string;
  children: React.ReactNode;
  testId: string;
}>;

function BalanceColumn({ title, children, testId }: BalanceColumnProps) {
  return (
    <div className="flex flex-col items-start gap-4" data-testid={testId}>
      <span className="body-2 text-muted">{title}</span>
      {children}
    </div>
  );
}

export function ConfidentialBalanceFooterView({
  isVisible,
  phase,
  error,
  state,
  wrapper,
  permitValidityDays,
  publicLabel,
  privateLabel,
  lastRevealedLabel,
  totalLabel,
  permitExpiresOn,
  onReveal,
  onRetry,
}: ConfidentialBalanceFooterViewModel) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  const isRevealing = phase === "signing" || phase === "decrypting";

  return (
    <div
      className="mt-16 flex flex-col gap-12 border-t border-muted-subtle px-20 pt-20"
      data-testid="confidential-balance-footer"
    >
      {state && (
        <div className="flex flex-row items-start gap-48">
          <BalanceColumn
            title={t("confidentialBalance.publicBalance")}
            testId="confidential-public-balance"
          >
            <span className="heading-5-semi-bold text-base">{publicLabel}</span>
          </BalanceColumn>
          <BalanceColumn
            title={t("confidentialBalance.privateBalance")}
            testId="confidential-private-balance"
          >
            {privateLabel ? (
              <span className="heading-5-semi-bold text-base">{privateLabel}</span>
            ) : (
              <Tag
                appearance="gray"
                label={t("confidentialBalance.undisclosed")}
                data-testid="confidential-undisclosed-badge"
              />
            )}
            {lastRevealedLabel && (
              <span className="body-3 text-muted" data-testid="confidential-last-revealed">
                {t("confidentialBalance.lastRevealed", { amount: lastRevealedLabel })}
              </span>
            )}
          </BalanceColumn>
          {totalLabel && (
            <BalanceColumn title={t("confidentialBalance.total")} testId="confidential-total">
              <span className="heading-5-semi-bold text-base">{totalLabel}</span>
            </BalanceColumn>
          )}
          <div className="ml-auto">
            <Button
              appearance={state === "decrypted" ? "gray" : "accent"}
              size="sm"
              loading={isRevealing}
              disabled={isRevealing}
              onClick={onReveal}
              data-testid={
                state === "decrypted" ? "confidential-refresh-button" : "confidential-reveal-button"
              }
            >
              {state === "decrypted"
                ? t("confidentialBalance.refresh")
                : t("confidentialBalance.reveal")}
            </Button>
          </div>
        </div>
      )}

      {isRevealing && (
        <div className="flex flex-row items-center gap-8" data-testid="confidential-phase">
          <Spinner size={16} />
          <span className="body-3 text-muted">
            {phase === "signing"
              ? t("confidentialBalance.phase.signing")
              : t("confidentialBalance.phase.decrypting")}
          </span>
        </div>
      )}

      {!isRevealing && state && (
        <span className="body-3 text-muted" data-testid="confidential-permit-info">
          {permitExpiresOn
            ? t("confidentialBalance.permitValidUntil", { date: permitExpiresOn })
            : t("confidentialBalance.revealHint", {
                contract: wrapper,
                days: permitValidityDays,
              })}
        </span>
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
          data-testid={`confidential-error-${error}`}
        />
      )}
    </div>
  );
}

type Props = Readonly<{
  account: TokenAccount;
}>;

function ConfidentialBalanceFooterContainer({ account }: Props) {
  const viewModel = useConfidentialBalanceFooterViewModel({ account });
  return <ConfidentialBalanceFooterView {...viewModel} />;
}

export function ConfidentialBalanceFooter({ account }: Props) {
  const rereadHandleOnNewOperation = account.operationsCount;
  return <ConfidentialBalanceFooterContainer key={rereadHandleOnNewOperation} account={account} />;
}
