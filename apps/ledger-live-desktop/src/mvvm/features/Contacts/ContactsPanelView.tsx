import React, { useCallback, useState } from "react";
import { firstValueFrom } from "rxjs";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { ContactsPanelViewProps } from "./types";

// Hard-coded smoke fixtures (L1 only). L3 replaces these with real form input.
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
  accountName: "Account 1",
  accountPath: "44'/60'/0'/0/1",
};

const ContactsPanelView = ({ sessionId, setSessionId }: ContactsPanelViewProps) => {
  const { t } = useTranslation();
  const dmk = useDeviceManagementKit();
  const contacts = useContacts(sessionId);

  const [lastResult, setLastResult] = useState<unknown>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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
    (label: string, fn: () => Promise<unknown>) => async () => {
      setLastError(null);
      setLastResult(null);
      try {
        const result = await fn();
        setLastResult({ verb: label, result });
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e));
      }
    },
    [],
  );

  const isEmpty =
    Object.keys(contacts.wallet.contacts).length === 0 &&
    Object.keys(contacts.wallet.accounts).length === 0;
  const ready = contacts.isReady;

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8">
        <p className="body-2-medium">
          {connecting
            ? t("contacts.connecting")
            : sessionId
              ? t("contacts.connected")
              : t("contacts.disconnected")}
        </p>
        {sessionId ? (
          <Button appearance="gray" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button
            appearance="accent"
            size="sm"
            loading={connecting}
            disabled={connecting || !dmk}
            onClick={handleConnect}
          >
            {t("contacts.connect")}
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-8">
        <Button
          appearance="gray"
          size="sm"
          disabled={!ready}
          onClick={runVerb("addContact", () =>
            contacts.addContact({
              name: FIXTURE.contactName,
              addressHex: FIXTURE.addressMainnet,
              scope: FIXTURE.scopeMainnet,
              derivationPath: FIXTURE.derivationPath,
              chainId: FIXTURE.chainIdMainnet,
            }),
          )}
        >
          {t("contacts.actions.addContact")}
        </Button>

        <Button
          appearance="gray"
          size="sm"
          disabled={!ready}
          onClick={runVerb("addAddressToContact", () =>
            contacts.addAddressToContact({
              contactName: FIXTURE.contactName,
              name: FIXTURE.contactName,
              addressHex: FIXTURE.addressPolygon,
              scope: "Polygon",
              derivationPath: FIXTURE.derivationPath,
              chainId: FIXTURE.chainIdPolygon,
            }),
          )}
        >
          {t("contacts.actions.addAddressToContact")}
        </Button>

        <Button
          appearance="gray"
          size="sm"
          disabled={!ready}
          onClick={runVerb("editAddressLabel", () =>
            contacts.editAddressLabel({
              contactName: FIXTURE.contactName,
              oldLabel: FIXTURE.scopeMainnet,
              newLabel: FIXTURE.scopeRenamedLabel,
              addressHex: FIXTURE.addressMainnet,
              chainId: FIXTURE.chainIdMainnet,
            }),
          )}
        >
          {t("contacts.actions.editAddressLabel")}
        </Button>

        <Button
          appearance="gray"
          size="sm"
          disabled={!ready}
          onClick={runVerb("editAddress", () =>
            contacts.editAddress({
              contactName: FIXTURE.contactName,
              oldAddressHex: FIXTURE.addressMainnet,
              newAddressHex: FIXTURE.addressRotated,
              chainId: FIXTURE.chainIdMainnet,
            }),
          )}
        >
          {t("contacts.actions.editAddress")}
        </Button>

        <Button
          appearance="gray"
          size="sm"
          disabled={!ready}
          onClick={runVerb("renameContact", () =>
            contacts.renameContact({
              oldName: FIXTURE.contactName,
              newName: FIXTURE.renamedTo,
            }),
          )}
        >
          {t("contacts.actions.renameContact")}
        </Button>

        <Button
          appearance="gray"
          size="sm"
          disabled={!ready}
          onClick={runVerb("addLedgerAccount", () =>
            contacts.addLedgerAccount({
              name: FIXTURE.accountName,
              derivationPath: FIXTURE.accountPath,
              chainId: FIXTURE.chainIdMainnet,
            }),
          )}
        >
          {t("contacts.actions.addLedgerAccount")}
        </Button>
      </section>

      <section className="flex flex-col gap-8">
        <Button
          appearance="red"
          size="sm"
          disabled={isEmpty}
          onClick={runVerb("reset", () => contacts.reset())}
        >
          {t("contacts.actions.reset")}
        </Button>
      </section>

      <section className="flex flex-col gap-4">
        <p className="body-2-semi-bold">{t("contacts.walletState")}</p>
        <pre className="body-3-regular bg-base-c20 max-h-160 overflow-auto rounded p-8 text-xs">
          {isEmpty ? t("contacts.empty") : JSON.stringify(contacts.wallet, null, 2)}
        </pre>
      </section>

      {lastResult !== null && (
        <section className="flex flex-col gap-4">
          <p className="body-2-semi-bold">{t("contacts.lastResult")}</p>
          <pre className="body-3-regular bg-base-c20 max-h-120 overflow-auto rounded p-8 text-xs">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </section>
      )}

      {lastError !== null && (
        <section className="flex flex-col gap-4">
          <p className="body-2-semi-bold text-error-c80">{t("contacts.lastError")}</p>
          <pre className="body-3-regular bg-error-c20 max-h-120 overflow-auto rounded p-8 text-xs">
            {lastError}
          </pre>
        </section>
      )}
    </div>
  );
};

export default ContactsPanelView;
