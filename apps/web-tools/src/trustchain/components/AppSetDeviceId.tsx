import React, { useCallback, useEffect, useState } from "react";
import { Bluetooth } from "@ledgerhq/lumen-ui-react/symbols";
import { getEnv } from "@shared/env";
import { buildMockServerDeviceId, parseDeviceId, type TransportKind } from "../deviceTarget";
import { getMockServerUiUrl, useMockServerSession } from "../mockServerSession";
import { Actionable } from "./Actionable";
import { MockServerIcon, UsbIcon } from "./DeviceTransportIcons";

const fieldClassName = "bg-muted rounded-md px-8 py-6 body-2 text-base";

const TRANSPORTS: { kind: TransportKind; label: string; icon: React.ReactNode }[] = [
  { kind: "webhid", label: "USB", icon: <UsbIcon /> },
  { kind: "webble", label: "Bluetooth", icon: <Bluetooth size={24} /> },
  { kind: "mockserver", label: "Mock server", icon: <MockServerIcon /> },
];

function TransportPicker({
  kind,
  onChange,
}: {
  kind: TransportKind;
  onChange: (kind: TransportKind) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Transport" className="flex gap-8">
      {TRANSPORTS.map(transport => {
        const selected = transport.kind === kind;
        return (
          <button
            key={transport.kind}
            type="button"
            role="radio"
            aria-checked={selected}
            title={`${transport.label} (${transport.kind})`}
            onClick={() => onChange(transport.kind)}
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-md border px-4 py-8 body-4 ${
              selected
                ? "border-active bg-base text-base"
                : "border-transparent bg-muted text-muted hover:text-base"
            }`}
          >
            <span className="flex h-[28px] items-center">{transport.icon}</span>
            {transport.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppSetDeviceId({
  deviceId,
  setDeviceId,
}: {
  deviceId: string;
  setDeviceId: (deviceId: string) => void;
}) {
  const [kind, setKind] = useState<TransportKind>("webhid");
  const [mockServerToken, setMockServerToken] = useState("");
  const mockServerSession = useMockServerSession(deviceId);
  const mockServerUrl = getEnv("MOCK_SERVER_TRANSPORT_URL");

  useEffect(() => {
    const target = parseDeviceId(deviceId);
    if (!target) return;
    setKind(target.kind);
    if (target.kind === "mockserver") setMockServerToken(target.token ?? "");
  }, [deviceId]);

  const localDeviceId = kind === "mockserver" ? buildMockServerDeviceId(mockServerToken) : kind;

  // Picking a transport applies it right away: only a session token to join needs a deliberate
  // "Apply", since it has to be typed first.
  const pickTransport = useCallback(
    (picked: TransportKind) => {
      setKind(picked);
      setDeviceId(picked === "mockserver" ? buildMockServerDeviceId(mockServerToken) : picked);
    },
    [setDeviceId, mockServerToken],
  );

  const action = useCallback(
    (deviceId: string) => (setDeviceId(deviceId), deviceId),
    [setDeviceId],
  );

  return (
    <>
      <Actionable
        buttonTitle="Set DeviceId"
        label="Device ID"
        inputs={deviceId !== localDeviceId ? [localDeviceId] : null}
        action={action}
        value={deviceId}
        setValue={v => setDeviceId(v || deviceId)}
        valueDisplay={v => v}
      >
        <TransportPicker kind={kind} onChange={pickTransport} />
        {kind === "mockserver" ? (
          <input
            className={`flex-1 ${fieldClassName}`}
            aria-label="Mock server session token"
            placeholder="Session token (optional)"
            title="Leave empty to create a new mock server session"
            spellCheck={false}
            value={mockServerToken}
            onChange={e => setMockServerToken(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && deviceId !== localDeviceId) setDeviceId(localDeviceId);
            }}
          />
        ) : null}
      </Actionable>
      {mockServerSession ? (
        <div className="flex items-center gap-8 my-4 body-3">
          <code className="flex-1 bg-muted rounded-md px-8 py-6 text-base truncate">
            {mockServerSession.token}
          </code>
          <a
            className="text-base underline"
            href={getMockServerUiUrl(mockServerUrl, mockServerSession.token)}
            target="_blank"
            rel="noreferrer"
          >
            Open mock server
          </a>
        </div>
      ) : null}
    </>
  );
}
