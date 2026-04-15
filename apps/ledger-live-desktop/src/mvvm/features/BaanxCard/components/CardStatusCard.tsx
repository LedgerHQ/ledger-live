import React from "react";
import { useTranslation } from "react-i18next";
import type { BaanxCardStatus } from "@ledgerhq/baanx";

interface Props {
  readonly data: BaanxCardStatus | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "text-success bg-success/10";
    case "FROZEN":
      return "text-warning bg-warning/10";
    case "BLOCKED":
      return "text-error bg-error/10";
    default:
      return "text-muted bg-surface";
  }
}

export function CardStatusCard({ data, isLoading, error }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md bg-surface">
        <span className="body-2 text-muted">{t("baanxCard.cardStatus.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md bg-surface">
        <span className="body-2 text-error">{t("baanxCard.cardStatus.error")}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md bg-surface">
        <span className="body-2 text-muted">{t("baanxCard.cardStatus.noCard")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 rounded-md bg-surface p-24" data-testid="baanx-card-status">
      <div className="flex items-center justify-between">
        <span className="heading-3-semi-bold text-base">{data.holderName}</span>
        <span className={`rounded-full px-12 py-4 body-3-semi-bold ${statusColor(data.status)}`}>
          {data.status}
        </span>
      </div>

      <div className="flex gap-32">
        <div className="flex flex-col gap-4">
          <span className="body-3 text-muted">{t("baanxCard.cardStatus.cardNumber")}</span>
          <span className="body-2-semi-bold text-base">•••• {data.panLast4}</span>
        </div>
        <div className="flex flex-col gap-4">
          <span className="body-3 text-muted">{t("baanxCard.cardStatus.expiry")}</span>
          <span className="body-2-semi-bold text-base">{data.expiryDate}</span>
        </div>
        <div className="flex flex-col gap-4">
          <span className="body-3 text-muted">{t("baanxCard.cardStatus.type")}</span>
          <span className="body-2-semi-bold text-base">{data.type}</span>
        </div>
      </div>
    </div>
  );
}
