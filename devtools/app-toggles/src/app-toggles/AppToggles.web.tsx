import { Switch } from "@ledgerhq/lumen-ui-react";
import { Lock } from "@ledgerhq/lumen-ui-react/symbols";
import type { AppToggle, AppTogglesToolProps } from "../types";
import { copy } from "./copy";

export function AppToggles({ toggles }: AppTogglesToolProps) {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-12 border-b border-muted-subtle px-16 py-12">
        <h3 className="body-2-semi-bold text-base">{copy.togglesTitle}</h3>
        {toggles.length === 0 ? (
          <span className="body-3 text-muted">{copy.noToggles}</span>
        ) : (
          toggles.map(toggle => <ToggleRow key={toggle.id} toggle={toggle} />)
        )}
      </section>
    </div>
  );
}

function ToggleRow({ toggle }: Readonly<{ toggle: AppToggle }>) {
  const switchId = `app-toggles-${toggle.id}`;
  const isLocked = toggle.lockedReason !== null;

  return (
    <div className="flex items-center justify-between gap-12">
      <div className="flex flex-col gap-4">
        <label htmlFor={switchId} className="body-2 text-base">
          {toggle.label}
        </label>
        <span className="body-3 text-muted">{toggle.description}</span>
        {isLocked && (
          <span className="flex items-center gap-4 body-3 text-muted">
            <Lock size={16} aria-hidden />
            {toggle.lockedReason}
          </span>
        )}
      </div>
      <Switch
        id={switchId}
        size="sm"
        selected={toggle.isOn}
        disabled={isLocked}
        onChange={toggle.onChange}
      />
    </div>
  );
}
