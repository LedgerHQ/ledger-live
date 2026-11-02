import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

type PerpsAmountStatusProps = Readonly<{
  quotedAmountText: string | null;
  isQuoteLoading: boolean;
  notice: string | null;
  errorMessage: string | null;
  testIdPrefix: string;
}>;

function QuotedAmount({
  quotedAmountText,
  isQuoteLoading,
  testIdPrefix,
}: Pick<PerpsAmountStatusProps, "quotedAmountText" | "isQuoteLoading" | "testIdPrefix">) {
  if (isQuoteLoading) {
    return (
      <Skeleton className="h-16 w-144 rounded-sm" data-testid={`${testIdPrefix}-quote-skeleton`} />
    );
  }

  if (!quotedAmountText) return null;

  return <div className="body-3 text-muted">{quotedAmountText}</div>;
}

export function PerpsAmountStatus({
  quotedAmountText,
  isQuoteLoading,
  notice,
  errorMessage,
  testIdPrefix,
}: PerpsAmountStatusProps) {
  const error = errorMessage ? (
    <p className="body-3 text-error" data-testid={`${testIdPrefix}-form-error`}>
      {errorMessage}
    </p>
  ) : null;

  const noticeText = notice ? <p className="body-2 text-base">{notice}</p> : null;

  return (
    <div className="mb-40 flex flex-col items-center gap-8 text-center">
      <div className="flex min-h-20 items-center justify-center">
        <QuotedAmount
          quotedAmountText={quotedAmountText}
          isQuoteLoading={isQuoteLoading}
          testIdPrefix={testIdPrefix}
        />
      </div>
      <div className="flex min-h-40 items-center justify-center">{error ?? noticeText}</div>
    </div>
  );
}
