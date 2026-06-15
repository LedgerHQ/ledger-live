import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { themeSelector } from "~/renderer/actions/general";
import {
  extractErrorMessage,
  isSeedMismatchError,
  isUserRejectionError,
  prettyDeviceErrorMessage,
} from "~/renderer/contacts/deviceErrors";

type Phase =
  | { kind: "connect" }
  | { kind: "in-app"; device: Device }
  | { kind: "error"; message: string }
  | { kind: "rejected" }
  | { kind: "seed-mismatch" };

type Props = {
  /**
   * Domain action that runs once the Ethereum app is open. Receives the
   * `deviceId` of the connected device — the verb is expected to do its own
   * short-lived `withDevice` open via the contacts boundary.
   */
  run: (deviceId: string) => Promise<unknown>;
  /** Called when the runner is dismissed — `ok=true` on success, `ok=false` on user-driven back. */
  onDone: (ok: boolean) => void;
  /**
   * Optional: lets the caller take over the seed-mismatch terminal instead of
   * rendering the built-in fullscreen screen. The polished L4 dialogs pass this
   * to swap to a Lumen info dialog; the L1 debug panel omits it and keeps the
   * built-in screen. The callback owns teardown (it closes/advances its own
   * surface), so the runner simply hands off and stops here.
   */
  onSeedMismatch?: () => void;
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
const RunDeviceAction = ({ run, onDone, onSeedMismatch }: Props) => {
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
        // The contact/address is seed-bound: editing it with a device
        // holding a different seed fails the on-device HMAC check (SW
        // 0x6982). That's not a generic failure — guide the user to the
        // device that registered it instead of a vague error.
        if (isSeedMismatchError(e)) {
          // L4 hands this to a polished Lumen info dialog; L1 (no handler)
          // falls back to the built-in seed-mismatch screen below.
          if (onSeedMismatch) {
            onSeedMismatch();
            return;
          }
          setPhase({ kind: "seed-mismatch" });
          return;
        }
        // The user declined the operation on the device (SW 0x6a80). Show
        // the same Lumen "Action rejected" terminal the Send flow uses, with
        // a retry — rather than the alarming generic error screen.
        if (isUserRejectionError(e)) {
          setPhase({ kind: "rejected" });
          return;
        }
        // Always show feedback — silently bouncing back to the previous
        // step would make the dialog look broken. We surface a single
        // neutral "Something went wrong" screen with the extracted
        // human-readable message: DMK turned out to use the
        // "canceled by user" phrase for non-cancel failures too, so
        // branding any of them as a cancel risks lying to the user.
        setPhase({ kind: "error", message: extractErrorMessage(e) });
      }
    },
    [run, onDone, onSeedMismatch],
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

  if (phase.kind === "rejected") {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-24 px-16">
        <Spot appearance="info" size={72} />
        <div className="flex flex-col items-center gap-8 text-center">
          <p className="heading-3-semi-bold text-base">
            {t("errors.UserRefusedOnDevice.title")}
          </p>
          <p className="body-2 text-muted">{t("errors.UserRefusedOnDevice.description")}</p>
        </div>
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
            {t("contacts.runner.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  if (phase.kind === "seed-mismatch") {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-16 px-16">
        <p className="body-2-semi-bold text-base text-center">
          {t("contacts.runner.seedMismatchTitle")}
        </p>
        <p className="body-3 text-muted text-center select-text">
          {t("contacts.runner.seedMismatchDescription")}
        </p>
        <div className="flex flex-col gap-8 w-full">
          <Button
            appearance="base"
            size="sm"
            isFull
            onClick={() => setPhase({ kind: "connect" })}
          >
            {t("contacts.runner.seedMismatchRetry")}
          </Button>
          <Button appearance="gray" size="sm" isFull onClick={() => onDone(false)}>
            {t("contacts.runner.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-16 px-16">
      <p className="body-2-semi-bold text-error text-center">{t("contacts.runner.error")}</p>
      <p className="body-3 text-muted text-center break-all select-text">
        {prettyDeviceErrorMessage(phase.message)}
      </p>
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
