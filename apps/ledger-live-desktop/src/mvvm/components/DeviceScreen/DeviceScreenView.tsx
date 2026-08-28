import React from "react";
import type { DeviceScreenState } from "@ledgerhq/live-dmk-desktop";
import { ChevronDown, ChevronUp, Devices } from "@ledgerhq/lumen-ui-react/symbols";
import { DeviceOsInfo } from "./components/DeviceOsInfo";
import { DeviceScreenButtons } from "./components/DeviceScreenButtons";
import { DeviceScreenImage } from "./components/DeviceScreenImage";
import type { DeviceScreenViewModel } from "./types";
import type { DeviceScreenModel } from "./utils/deviceModel";

export interface DeviceScreenViewProps {
  readonly viewModel: DeviceScreenViewModel;
}

/**
 * Live screen of the emulated device, docked at the foot of the sidebar next to
 * the navigation. Rendered only while the mock server transport is driving a
 * device, and collapsible to its header row.
 *
 * What fills it is decided by the view model, not here.
 */
export function DeviceScreenView({ viewModel }: DeviceScreenViewProps) {
  const { isVisible, collapsed, handleToggleCollapsed, model, state } = viewModel;

  if (!isVisible || !model) return null;

  const Chevron = collapsed ? ChevronUp : ChevronDown;

  return (
    <div className="flex flex-col rounded-md bg-canvas-muted" data-testid="device-screen">
      <button
        type="button"
        onClick={handleToggleCollapsed}
        aria-expanded={!collapsed}
        className="flex select-none items-center gap-8 px-12 py-8"
        data-testid="device-screen-toggle"
      >
        <Devices size={16} className="text-muted" />
        <span className="body-4 flex-1 text-left text-muted">{model.label} screen</span>
        <Chevron size={16} className="text-muted" />
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-8 px-12 pb-12">{renderScreen(state, model)}</div>
      )}
    </div>
  );
}

function renderScreen(state: DeviceScreenState, model: DeviceScreenModel) {
  switch (state.kind) {
    case "loading":
      return <span className="body-4 text-muted">Loading…</span>;
    case "error":
      return <span className="body-4 break-words text-error">{state.message}</span>;
    case "os-info":
      return <DeviceOsInfo device={state.device} />;
    case "image":
      return (
        <>
          <DeviceScreenImage
            src={state.src}
            onTouch={model.touch ? state.input.touch : undefined}
          />
          {model.buttons && <DeviceScreenButtons onPress={state.input.pressButton} />}
        </>
      );
    default:
      return null;
  }
}
