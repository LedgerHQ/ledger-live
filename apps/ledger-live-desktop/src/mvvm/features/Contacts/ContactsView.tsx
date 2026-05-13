import React from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { GroupUsers } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import ContactsPanelView from "./ContactsPanelView";
import type { ContactsViewProps } from "./types";

const ContactsView = ({ isOpen, onOpenChange, sessionId, setSessionId }: ContactsViewProps) => {
  const { t } = useTranslation();
  const label = t("topBar.contacts.tooltip");

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            appearance="gray"
            size="sm"
            aria-label={label}
            icon={GroupUsers}
            onClick={() => onOpenChange(true)}
            data-testid="topbar-contacts-button"
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={onOpenChange} height="fit">
        <DialogContent>
          <DialogHeader title={t("contacts.title")} onClose={() => onOpenChange(false)} />
          <DialogBody scrollbarWidth="auto">
            <ContactsPanelView sessionId={sessionId} setSessionId={setSessionId} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactsView;
