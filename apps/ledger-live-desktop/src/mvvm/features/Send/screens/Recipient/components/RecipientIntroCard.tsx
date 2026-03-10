import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ListItem } from "@ledgerhq/lumen-ui-react";
import {
  ChevronDown,
  ChevronUp,
  Information,
  Circles,
  LedgerDevices,
  CoinsCheck,
} from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

export function RecipientIntroCard() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen(open => !open);
  }, []);

  return (
    <div
      className={cn("pt-12", isOpen ? "mb-16" : "mt-32")}
      data-testid="send-recipient-intro-card"
    >
      <div className="overflow-hidden rounded-sm bg-surface">
        <ListItem
          className="cursor-pointer py-16"
          onClick={toggle}
          data-testid="send-recipient-security-toggle"
        >
          <div className="flex w-full items-center gap-8">
            <div className="flex min-w-0 flex-1 items-center">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center -mr-6">
                <Information size={24} />
              </div>
              <span className="body-2-semi-bold mx-12">{t("newSendFlow.securityInfo.title")}</span>
            </div>
            {isOpen ? (
              <ChevronUp size={20} className="text-muted mx-12" />
            ) : (
              <ChevronDown size={20} className="text-muted mx-12" />
            )}
          </div>
        </ListItem>

        {isOpen && (
          <div className="pb-16 px-8" data-testid="send-recipient-security-content">
            <div className="flex items-start mb-24 mt-12">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center">
                <Circles size={24} />
              </div>
              <p className="min-w-0 flex-1 body-2 whitespace-normal break-words px-6">
                {t("newSendFlow.securityInfo.items.compatibility")}
              </p>
            </div>

            <div className="flex items-start mb-24">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center">
                <LedgerDevices size={24} />
              </div>
              <p className="min-w-0 flex-1 body-2 whitespace-normal break-words px-6">
                {t("newSendFlow.securityInfo.items.review")}
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center">
                <CoinsCheck size={24} />
              </div>
              <p className="min-w-0 flex-1 body-2 whitespace-normal break-words px-6">
                {t("newSendFlow.securityInfo.items.smallAmount")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
