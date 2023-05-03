import React, { memo } from "react";
import { InvalidDomain, NoResolution } from "@ledgerhq/domain-service/errors/index";
import { DomainServiceResponseError } from "@ledgerhq/domain-service/hooks/types";
import Alert from "~/renderer/components/Alert";
import { useTranslation } from "react-i18next";

type DomainErrorsProps = {
  domainError: DomainServiceResponseError;
  isForwardResolution: boolean;
};
export const DomainErrorsView = memo(({ domainError, isForwardResolution }: DomainErrorsProps) => {
  const { t } = useTranslation();
  if ((domainError.error as Error) instanceof InvalidDomain) {
    return (
      <div data-testid="domain-error-invalid-domain">
        <Alert
          mt={5}
          showIcon
          title={t("send.steps.recipient.domainService.invalidDomain.title")}
          type="warning"
          learnMoreLabel={t("common.learnMore")}
          learnMoreUrl="https://support.ledger.com/hc/articles/9710787581469?docs=true"
        >
          {t("send.steps.recipient.domainService.invalidDomain.description")}
        </Alert>
      </div>
    );
  }

  if ((domainError.error as Error) instanceof NoResolution && isForwardResolution) {
    return (
      <div data-testid="domain-error-no-resolution">
        <Alert
          mt={5}
          showIcon
          title={t("send.steps.recipient.domainService.noResolution.title")}
          type="secondary"
        />
      </div>
    );
  }

  return null;
});
DomainErrorsView.displayName = "DomainErrorsView";
