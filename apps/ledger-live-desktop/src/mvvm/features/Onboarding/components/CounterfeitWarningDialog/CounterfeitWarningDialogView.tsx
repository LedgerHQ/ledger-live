import React from "react";
import { Trans } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Link,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import type { CounterfeitWarningDialogViewProps } from "./useCounterfeitWarningDialogViewModel";

type BodyLinkProps = Readonly<{
  children?: React.ReactNode;
  onClick: () => void;
}>;

const BodyLink = ({ children, onClick }: BodyLinkProps) => (
  <Link appearance="inherit" size="inherit" underline onClick={onClick}>
    {children}
  </Link>
);

const CounterfeitWarningDialogView = ({
  open,
  title,
  primaryCtaLabel,
  secondaryCtaLabel,
  onProceed,
  onLearnMore,
  onLedgerComLink,
  onResellerLink,
  onDismiss,
}: CounterfeitWarningDialogViewProps) => {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onDismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[480px]"
        data-testid="counterfeit-warning-dialog"
      >
        <DialogHeader density="compact" onClose={onDismiss} />
        <DialogBody className="items-center gap-24 px-24 pb-16 text-center">
          <Spot appearance="info" size={72} />
          <div className="flex flex-col items-center gap-12">
            <h2 className="heading-4-semi-bold text-base">{title}</h2>
            <p className="body-2 text-muted">
              <Trans
                i18nKey="onboarding.counterfeitWarning.body"
                components={{
                  ledgerCom: <BodyLink onClick={onLedgerComLink} />,
                  resellerLink: <BodyLink onClick={onResellerLink} />,
                }}
              />
            </p>
          </div>
          <div className="flex w-full flex-col gap-16">
            <Button appearance="base" isFull size="lg" onClick={onProceed}>
              {primaryCtaLabel}
            </Button>
            <Button appearance="gray" isFull size="lg" onClick={onLearnMore}>
              {secondaryCtaLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default CounterfeitWarningDialogView;
