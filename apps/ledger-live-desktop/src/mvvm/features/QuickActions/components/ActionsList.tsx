import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowDown, Plus, Minus, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { useQuickActions } from "../hooks/useQuickActions";

interface ActionsListProps {
  hasFunds?: boolean;
}

export const ActionsList = ({ hasFunds }: ActionsListProps) => {
  const { t } = useTranslation();
  const { onSend, onReceive, onBuy, onSell } = useQuickActions();

  return (
    <div className="flex items-center gap-12" data-testid="quick-actions-actions-list">
      <Button appearance="base" size="sm" icon={ArrowDown} onClick={onReceive}>
        {t("quickActions.receive")}
      </Button>
      <Button appearance="transparent" size="sm" icon={Plus} onClick={onBuy}>
        {t("quickActions.buy")}
      </Button>
      <Button appearance="transparent" size="sm" icon={Minus} onClick={onSell} disabled={!hasFunds}>
        {t("quickActions.sell")}
      </Button>
      <Button appearance="transparent" size="sm" icon={ArrowUp} onClick={onSend}>
        {t("quickActions.send")}
      </Button>
    </div>
  );
};
