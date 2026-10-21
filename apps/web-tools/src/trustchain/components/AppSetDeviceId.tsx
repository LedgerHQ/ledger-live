import React, { useCallback, useEffect, useState } from "react";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { MockServerDevice } from "@ledgerhq/device-mockserver-react";
import { getEnv } from "@shared/env";
import {
  buildMockServerDeviceId,
  buildSpeculosDeviceId,
  DEFAULT_SPECULOS_MODEL,
  DEFAULT_SPECULOS_URL,
  parseDeviceId,
  SPECULOS_MODELS,
  type TransportKind,
} from "../deviceTarget";
import { getMockServerUiUrl, useMockServerSession } from "../mockServerSession";
import { Actionable } from "./Actionable";

const MOCK_SERVER_DEVICE_ZOOM = 1.5;

const fieldClassName = "bg-base border border-base rounded-md px-8 py-6 body-2 text-base";

export function AppSetDeviceId({
  deviceId,
  setDeviceId,
}: {
  deviceId: string;
  setDeviceId: (deviceId: string) => void;
}) {
  const [kind, setKind] = useState<TransportKind>("webhid");
  const [speculosUrl, setSpeculosUrl] = useState(DEFAULT_SPECULOS_URL);
  const [speculosModel, setSpeculosModel] = useState<DeviceModelId>(DEFAULT_SPECULOS_MODEL);
  const [mockServerToken, setMockServerToken] = useState("");
  const mockServerSession = useMockServerSession(deviceId);
  const mockServerUrl = getEnv("MOCK_SERVER_TRANSPORT_URL");

  useEffect(() => {
    const target = parseDeviceId(deviceId);
    if (!target) return;
    setKind(target.kind);
    if (target.kind === "speculos") {
      setSpeculosUrl(target.url);
      setSpeculosModel(target.model);
    }
    if (target.kind === "mockserver") setMockServerToken(target.token ?? "");
  }, [deviceId]);

  const localDeviceId =
    kind === "speculos"
      ? buildSpeculosDeviceId(speculosUrl, speculosModel)
      : kind === "mockserver"
        ? buildMockServerDeviceId(mockServerToken)
        : kind;

  const action = useCallback(
    (deviceId: string) => (setDeviceId(deviceId), deviceId),
    [setDeviceId],
  );

  return (
    <>
      <Actionable
        buttonTitle="Set DeviceId"
        inputs={deviceId !== localDeviceId ? [localDeviceId] : null}
        action={action}
        value={deviceId}
        setValue={v => setDeviceId(v || deviceId)}
        valueDisplay={v => v}
      >
        <select
          className={`flex-1 ${fieldClassName}`}
          value={kind}
          onChange={e => setKind(e.target.value as TransportKind)}
        >
          <option value="webhid">webhid</option>
          <option value="webble">webble</option>
          <option value="mockserver">mockserver</option>
          <option value="speculos">speculos</option>
        </select>
        {kind === "speculos" ? (
          <>
            <input
              className={`flex-1 ${fieldClassName}`}
              aria-label="Speculos URL"
              value={speculosUrl}
              onChange={e => setSpeculosUrl(e.target.value)}
            />
            <select
              className={fieldClassName}
              aria-label="Speculos device model"
              value={speculosModel}
              onChange={e => setSpeculosModel(e.target.value as DeviceModelId)}
            >
              {SPECULOS_MODELS.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </>
        ) : null}
        {kind === "mockserver" ? (
          <input
            className={`flex-1 ${fieldClassName}`}
            aria-label="Mock server session token"
            placeholder="Session token (empty creates a new session)"
            spellCheck={false}
            value={mockServerToken}
            onChange={e => setMockServerToken(e.target.value)}
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
      {mockServerSession?.mockDeviceId ? (
        // The package exposes no size prop; `zoom` (unlike `transform`) keeps the window fixed to
        // the viewport.
        <div className="pointer-events-auto text-base" style={{ zoom: MOCK_SERVER_DEVICE_ZOOM }}>
          <MockServerDevice
            url={mockServerUrl}
            token={mockServerSession.token}
            deviceId={mockServerSession.mockDeviceId}
            floating
          />
        </div>
      ) : null}
    </>
  );
}
