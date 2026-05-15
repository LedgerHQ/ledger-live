import React, { useCallback, useState } from "react";
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
import RunDeviceAction from "./components/RunDeviceAction";
import type { ContactsSubView, ContactsViewProps, RunVerb } from "./types";

const TITLE_KEY: Record<ContactsSubView, string> = {
  overview: "contacts.title",
  external: "contacts.overview.external.title",
  accounts: "contacts.overview.accounts.title",
  storage: "contacts.storageTitle",
};

type Pending = {
  verb: (deviceId: string) => Promise<unknown>;
  resolve: (ok: boolean) => void;
};

const ContactsView = ({
  isOpen,
  onOpenChange,
  subView,
  setSubView,
}: ContactsViewProps) => {
  const { t } = useTranslation();
  const label = t("topBar.contacts.tooltip");

  // The pending verb is hoisted here so the dialog header can hide the
  // back-arrow and so closing the dialog tears down the in-flight action via
  // unmount (React unmounts RunDeviceAction → which unmounts <DeviceAction>
  // → which cleans up its connectApp subscription).
  const [pending, setPending] = useState<Pending | null>(null);
  const isBusy = pending !== null;

  const run = useCallback<RunVerb>(
    verb =>
      new Promise<boolean>(resolve => {
        setPending({ verb, resolve });
      }),
    [],
  );

  const handlePendingDone = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  const handleBack = useCallback(() => {
    setSubView("overview");
  }, [setSubView]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && pending) {
        // Resolve any in-flight runner so the form's await doesn't dangle.
        pending.resolve(false);
        setPending(null);
      }
      onOpenChange(next);
    },
    [pending, onOpenChange],
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            appearance="accent"
            size="sm"
            aria-label={label}
            icon={GroupUsers}
            onClick={() => onOpenChange(true)}
            data-testid="topbar-contacts-button"
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={handleOpenChange} height="fixed">
        <DialogContent>
          <DialogHeader
            title={t(TITLE_KEY[subView])}
            onClose={() => handleOpenChange(false)}
            // Hide the back-arrow while the device flow owns the body — the
            // user navigates back via RunDeviceAction's own buttons.
            onBack={isBusy || subView === "overview" ? undefined : handleBack}
          />
          <DialogBody scrollbarWidth="auto" className="flex flex-col">
            {pending ? (
              <RunDeviceAction run={pending.verb} onDone={handlePendingDone} />
            ) : (
              <ContactsPanelView subView={subView} setSubView={setSubView} run={run} />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactsView;
