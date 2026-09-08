import React from "react";
import type { MockServerDevice } from "@ledgerhq/live-dmk-desktop";

export interface DeviceOsInfoProps {
  readonly device: MockServerDevice;
}

/**
 * Shown in place of the screen while the device runs no app: there is no
 * Speculos instance to capture, so the mock server's record of the device
 * stands in.
 */
export function DeviceOsInfo({ device }: DeviceOsInfoProps) {
  const apps = device.apps ?? [];
  const rows: [string, string][] = [
    ["Model", device.device_type],
    ["Firmware", device.firmware_version ?? "—"],
    ["Connectivity", device.connectivity_type],
    [`Apps (${apps.length})`, apps.map(app => app.name).join(", ") || "—"],
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="device-screen-os-info">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-8">
          <span className="body-4 text-muted">{label}</span>
          <span className="body-4 break-words text-right text-base">{value}</span>
        </div>
      ))}
    </div>
  );
}
