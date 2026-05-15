import React, { useCallback, useMemo, useState } from "react";
import { firstValueFrom } from "rxjs";
import { Button, Link } from "@ledgerhq/lumen-ui-react";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { ContactsPanelViewProps } from "./types";

const FIXTURE = {
  contactName: "Alice",
  renamedTo: "Bob",
  addressMainnet: "abcdef0123456789abcdef0123456789abcdef01",
  addressPolygon: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  addressRotated: "9999999999999999999999999999999999999999",
  scopeMainnet: "Trading wallet",
  scopeRenamedLabel: "Cold storage",
  derivationPath: "44'/60'/0'/0/0",
  chainIdMainnet: 1,
  chainIdPolygon: 137,
};

type VerbDef = {
  label: string;
  key: string;
  fn: () => Promise<unknown>;
  disabled?: boolean;
  hint?: string;
};

const ContactsPanelView = ({
  sessionId,
  setSessionId,
  subView,
  setSubView,
}: ContactsPanelViewProps) => {
  const { t } = useTranslation();
  const dmk = useDeviceManagementKit();
  const contacts = useContacts(sessionId);

  const accounts = useSelector(accountsSelector);
  const ledgerAccount = useMemo(
    () => accounts.find(a => a.type === "Account" && a.currency.id === "ethereum"),
    [accounts],
  );
  const ledgerAccountName = useMaybeAccountName(ledgerAccount);

  const [lastResult, setLastResult] = useState<unknown>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pendingVerb, setPendingVerb] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    if (!dmk) {
      setLastError("DMK not ready");
      return;
    }
    setLastError(null);
    setConnecting(true);
    try {
      const device = await firstValueFrom(dmk.startDiscovering({}));
      const newSessionId = await dmk.connect({ device });
      setSessionId(newSessionId);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  }, [dmk, setSessionId]);

  const handleDisconnect = useCallback(async () => {
    if (!dmk || !sessionId) return;
    try {
      await dmk.disconnect({ sessionId });
    } finally {
      setSessionId(null);
    }
  }, [dmk, sessionId, setSessionId]);

  const runVerb = useCallback(
    (key: string, fn: () => Promise<unknown>) => async () => {
      setLastError(null);
      setLastResult(null);
      setPendingVerb(key);
      try {
        const result = await fn();
        setLastResult({ verb: key, result });
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e));
      } finally {
        setPendingVerb(null);
      }
    },
    [],
  );

  const verbs: VerbDef[] = [
    {
      key: "addContact",
      label: t("contacts.actions.addContact"),
      fn: () =>
        contacts.addContact({
          name: FIXTURE.contactName,
          addressHex: FIXTURE.addressMainnet,
          scope: FIXTURE.scopeMainnet,
          derivationPath: FIXTURE.derivationPath,
          chainId: FIXTURE.chainIdMainnet,
        }),
    },
    {
      key: "addAddressToContact",
      label: t("contacts.actions.addAddressToContact"),
      fn: () =>
        contacts.addAddressToContact({
          contactName: FIXTURE.contactName,
          name: FIXTURE.contactName,
          addressHex: FIXTURE.addressPolygon,
          scope: "Polygon",
          derivationPath: FIXTURE.derivationPath,
          chainId: FIXTURE.chainIdPolygon,
        }),
    },
    {
      key: "editAddressLabel",
      label: t("contacts.actions.editAddressLabel"),
      fn: () =>
        contacts.editAddressLabel({
          contactName: FIXTURE.contactName,
          oldLabel: FIXTURE.scopeMainnet,
          newLabel: FIXTURE.scopeRenamedLabel,
          addressHex: FIXTURE.addressMainnet,
          chainId: FIXTURE.chainIdMainnet,
        }),
    },
    {
      key: "editAddress",
      label: t("contacts.actions.editAddress"),
      fn: () =>
        contacts.editAddress({
          contactName: FIXTURE.contactName,
          oldAddressHex: FIXTURE.addressMainnet,
          newAddressHex: FIXTURE.addressRotated,
          chainId: FIXTURE.chainIdMainnet,
        }),
    },
    {
      key: "renameContact",
      label: t("contacts.actions.renameContact"),
      fn: () =>
        contacts.renameContact({
          oldName: FIXTURE.contactName,
          newName: FIXTURE.renamedTo,
        }),
    },
    {
      key: "addLedgerAccount",
      label: t("contacts.actions.addLedgerAccount"),
      disabled: !ledgerAccount || !ledgerAccountName,
      hint: ledgerAccount && ledgerAccountName ? `${ledgerAccountName} — ${ledgerAccount.freshAddress}` : undefined,
      fn: () => {
        if (!ledgerAccount || !ledgerAccountName)
          throw new Error("No Ethereum account in this wallet");
        return contacts.addLedgerAccount({
          name: ledgerAccountName,
          derivationPath: ledgerAccount.freshAddressPath,
          chainId: FIXTURE.chainIdMainnet,
        });
      },
    },
  ];

  const isEmpty =
    Object.keys(contacts.wallet.contacts).length === 0 &&
    Object.keys(contacts.wallet.accounts).length === 0;
  const ready = contacts.isReady;
  const isBusy = pendingVerb !== null || connecting;

  if (subView === "storage") {
    return (
      <div className="flex flex-1 min-h-0 flex-col gap-12">
        <section className="flex flex-col gap-4">
          <p className="body-2-semi-bold text-base">{t("contacts.walletState")}</p>
          <pre className="body-3 text-base bg-muted rounded-md p-12 overflow-auto whitespace-pre-wrap break-all select-text">
            {isEmpty ? t("contacts.empty") : JSON.stringify(contacts.wallet, null, 2)}
          </pre>
        </section>

        {lastResult !== null && (
          <section className="flex flex-col gap-4">
            <p className="body-2-semi-bold text-base">{t("contacts.lastResult")}</p>
            <pre className="body-3 text-base bg-muted rounded-md p-12 overflow-auto whitespace-pre-wrap break-all select-text">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </section>
        )}

        {lastError !== null && (
          <section className="flex flex-col gap-4">
            <p className="body-2-semi-bold text-error">{t("contacts.lastError")}</p>
            <pre className="body-3 text-error bg-error-transparent rounded-md p-12 overflow-auto whitespace-pre-wrap break-all select-text">
              {lastError}
            </pre>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8">
        <p className="body-2-medium text-base">
          {connecting
            ? t("contacts.connecting")
            : sessionId
              ? t("contacts.connected")
              : t("contacts.disconnected")}
        </p>
        {sessionId ? (
          <Button
            appearance="gray"
            size="sm"
            disabled={isBusy}
            onClick={handleDisconnect}
          >
            {t("contacts.disconnect")}
          </Button>
        ) : (
          <Button
            appearance="accent"
            size="sm"
            loading={connecting}
            disabled={isBusy || !dmk}
            onClick={handleConnect}
          >
            {t("contacts.connect")}
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-8">
        {verbs.map(v => (
          <div key={v.key} className="flex flex-col gap-2">
            <Button
              appearance="gray"
              size="sm"
              loading={pendingVerb === v.key}
              disabled={!ready || v.disabled || (isBusy && pendingVerb !== v.key)}
              onClick={runVerb(v.key, v.fn)}
            >
              {v.label}
            </Button>
            {v.hint && (
              <p className="body-3 text-base break-all select-text">{v.hint}</p>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-8">
        <Button
          appearance="red"
          size="sm"
          loading={pendingVerb === "reset"}
          disabled={isEmpty || (isBusy && pendingVerb !== "reset")}
          onClick={runVerb("reset", () => contacts.reset())}
        >
          {t("contacts.actions.reset")}
        </Button>
      </section>

      <section className="flex flex-col items-start gap-4">
        <Link onClick={() => setSubView("storage")}>{t("contacts.viewStorage")}</Link>
        {lastError !== null && (
          <p className="body-3 text-error">{t("contacts.errorHint")}</p>
        )}
      </section>
    </div>
  );
};

export default ContactsPanelView;
