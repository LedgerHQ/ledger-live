// oxlint-disable typescript/consistent-type-assertions
import React, { type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  userEvent,
} from "@testing-library/react-native";
import { DeviceModelId, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { I18nTestProvider } from "@shared/i18n/testing";
import deviceOsUpdate, { type DeviceOsUpdateState } from "@domain/entity-device-os-update";
import { OsUpdatePortsProvider } from "../hooks/OsUpdatePortsProvider";
import type { OsUpdateDeviceModel } from "../types/OsUpdateDeviceModel";
import type { OsUpdatePorts } from "../types/OsUpdatePorts";

// The flow owns no catalog: its English copy lives in Mobile's, which `lint:i18n-keys` checks.
const MOBILE_CATALOG = join(
  __dirname,
  "../../../../../apps/ledger-live-mobile/src/locales/en/common.json",
);
const { osUpdates } = JSON.parse(readFileSync(MOBILE_CATALOG, "utf8")) as { osUpdates: unknown };
const resources = { en: { translation: { osUpdates } } };

const PRODUCT_NAMES: Record<DeviceModelId, string> = {
  [DeviceModelId.NANO_S]: "Ledger Nano S",
  [DeviceModelId.NANO_SP]: "Ledger Nano S Plus",
  [DeviceModelId.NANO_X]: "Ledger Nano X",
  [DeviceModelId.STAX]: "Ledger Stax",
  [DeviceModelId.FLEX]: "Ledger Flex",
  [DeviceModelId.APEX]: "Ledger Nano Gen5",
};
const ANALYTICS_MODEL_IDS: Record<DeviceModelId, string> = {
  [DeviceModelId.NANO_S]: "nanoS",
  [DeviceModelId.NANO_SP]: "nanoSP",
  [DeviceModelId.NANO_X]: "nanoX",
  [DeviceModelId.STAX]: "stax",
  [DeviceModelId.FLEX]: "europa",
  [DeviceModelId.APEX]: "apex",
};

function FakeDeviceIcon() {
  return null;
}

export function fakeDeviceModel(modelId: DeviceModelId): OsUpdateDeviceModel {
  const analyticsModelId = ANALYTICS_MODEL_IDS[modelId];
  return {
    productName: PRODUCT_NAMES[modelId],
    actionModelId: analyticsModelId as OsUpdateDeviceModel["actionModelId"],
    analyticsModelId,
    Icon: FakeDeviceIcon,
  };
}

export function createFakePorts(overrides: Partial<OsUpdatePorts> = {}): OsUpdatePorts {
  return {
    dmk: { listConnectedDevices: jest.fn(() => []) } as unknown as DeviceManagementKit,
    backupStorage: { getBackup: jest.fn(), saveBackup: jest.fn(), removeBackup: jest.fn() },
    getDeviceModel: fakeDeviceModel,
    getLastSeenOsVersion: () => undefined,
    keepScreenAwake: jest.fn(() => jest.fn()),
    openUrl: jest.fn(),
    openSupport: jest.fn(),
    renderReleaseNotes: jest.fn(() => null),
    ...overrides,
  };
}

export function createTestStore(deviceOsUpdateState?: Partial<DeviceOsUpdateState>) {
  return configureStore({
    reducer: { deviceOsUpdate },
    preloadedState: deviceOsUpdateState
      ? { deviceOsUpdate: { osUpdates: [], hasBackup: false, ...deviceOsUpdateState } }
      : undefined,
  });
}

type Options = Readonly<{
  ports?: OsUpdatePorts;
  deviceOsUpdate?: Partial<DeviceOsUpdateState>;
}>;

function createWrapper({ ports = createFakePorts(), deviceOsUpdate: state }: Options) {
  const store = createTestStore(state);
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Provider store={store}>
        <I18nTestProvider resources={resources}>
          <OsUpdatePortsProvider ports={ports}>{children}</OsUpdatePortsProvider>
        </I18nTestProvider>
      </Provider>
    );
  }
  return { store, ports, Wrapper };
}

/** Renders with the flow providers: the store, the Mobile English copy and fake ports. */
export function render(ui: React.ReactElement, options: Options = {}) {
  const { store, ports, Wrapper } = createWrapper(options);
  const user = userEvent.setup();
  return { ...rtlRender(ui, { wrapper: Wrapper }), store, ports, user };
}

export function renderHook<Result>(hook: () => Result, options: Options = {}) {
  const { store, ports, Wrapper } = createWrapper(options);
  return { ...rtlRenderHook(hook, { wrapper: Wrapper }), store, ports };
}

export { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
