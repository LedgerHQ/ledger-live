import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Button } from "@ledgerhq/lumen-ui-react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { themeSelector } from "~/renderer/actions/general";

type Phase =
  | { kind: "connect" }
  | { kind: "in-app"; device: Device }
  | { kind: "error"; message: string };

type Props = {
  /**
   * Domain action that runs once the Ethereum app is open. Receives the
   * `deviceId` of the connected device — the verb is expected to do its own
   * short-lived `withDevice` open via the contacts boundary.
   */
  run: (deviceId: string) => Promise<unknown>;
  /** Called when the runner is dismissed — `ok=true` on success, `ok=false` on user-driven back. */
  onDone: (ok: boolean) => void;
};

/**
 * Two-phase device flow:
 *   1. canonical `<DeviceAction>` driven by `useConnectAppAction()` — handles
 *      plug-in / unlock / open-Ethereum-app entirely, with the same Lottie
 *      states and error handling used by Receive and Send.
 *   2. once the app is open, render the canonical "verify on device" view
 *      and execute the caller's verb against the now-ready device.
 *
 * Mirrors `apps/ledger-live-desktop/src/renderer/modals/Receive/steps/StepConnectDevice.tsx`
 * + `StepReceiveFunds.tsx:159-162` — same component, same idioms, no custom
 * session machinery.
 */
const RunDeviceAction = ({ run, onDone }: Props) => {
  const { t } = useTranslation();
  const theme = useSelector(themeSelector);
  const [phase, setPhase] = useState<Phase>({ kind: "connect" });
  const action = useConnectAppAction();

  // No account binding — we just need the Ethereum app open. Adding an account
  // would force connectApp's expected-account validation, which is irrelevant
  // for managing the on-device contacts vault.
  const request = useMemo(() => ({ appName: "Ethereum" }), []);

  const handleResult = useCallback(
    async (result: AppResult) => {
      setPhase({ kind: "in-app", device: result.device });
      try {
        await run(result.device.deviceId);
        onDone(true);
      } catch (e) {
        setPhase({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [run, onDone],
  );

  const handleError = useCallback((e: Error) => {
    setPhase({ kind: "error", message: e.message });
  }, []);

  if (phase.kind === "connect") {
    return (
      <DeviceAction
        action={action}
        request={request}
        onResult={handleResult}
        onError={handleError}
        analyticsPropertyFlow="contacts"
      />
    );
  }

  if (phase.kind === "in-app") {
    const modelId: DeviceModelId = phase.device.modelId;
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-16 px-16">
        {renderVerifyUnwrapped({ modelId, type: theme })}
        <p className="body-2-semi-bold text-base text-center">
          {t("contacts.runner.confirming")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-16 px-16">
      <p className="body-2-semi-bold text-error text-center">{t("contacts.runner.error")}</p>
      <p className="body-3 text-muted text-center break-all select-text">{phase.message}</p>
      <div className="flex flex-col gap-8 w-full">
        <Button
          appearance="base"
          size="sm"
          isFull
          onClick={() => setPhase({ kind: "connect" })}
        >
          {t("contacts.runner.retry")}
        </Button>
        <Button appearance="gray" size="sm" isFull onClick={() => onDone(false)}>
          {t("contacts.runner.back")}
        </Button>
      </div>
    </div>
  );
};

export default RunDeviceAction;
