import { useCallback, useMemo, useRef, useState } from "react";
import type { AccountReceiveDeviceVerify, AccountReceiveVerifyRequest } from "@devtools/bindings";
import { planReceiveVerify, type ReceiveVerifyPlan } from "./buildReceiveVerifyIntentInput";

type ReadyPlan = Extract<ReceiveVerifyPlan, { type: "ready" }>;

export type AccountReceiveVerifyExecution = Readonly<{
  key: string;
  plan: ReadyPlan;
  onOutcome: (outcome: string) => void;
}>;

/**
 * Device verification for the account-receive tool, its outcome kept by key. One request at a
 * time: it is held from the click, so another click is refused until it ends.
 */
export function useAccountReceiveDeviceVerify(): {
  deviceVerify: AccountReceiveDeviceVerify;
  execution: AccountReceiveVerifyExecution | null;
} {
  const [running, setRunning] = useState<{ key: string; plan: ReadyPlan } | null>(null);
  const [outcomes, setOutcomes] = useState<Readonly<Record<string, string>>>({});
  const activeKeyRef = useRef<string | null>(null);

  const record = useCallback(
    (key: string, outcome: string) => setOutcomes(previous => ({ ...previous, [key]: outcome })),
    [],
  );

  const release = useCallback((key: string, outcome: string) => {
    activeKeyRef.current = null;
    setRunning(null);
    setOutcomes(previous => ({ ...previous, [key]: outcome }));
  }, []);

  const verify = useCallback(
    (request: AccountReceiveVerifyRequest) => {
      if (activeKeyRef.current !== null) {
        if (activeKeyRef.current !== request.key) {
          record(request.key, "refused: another verification is running");
        }
        return;
      }
      activeKeyRef.current = request.key;
      record(request.key, "preparing…");
      planReceiveVerify(request).then(
        plan => {
          if (plan.type === "unsupported") {
            release(request.key, `unsupported: ${plan.reason}`);
            return;
          }
          record(request.key, "verifying on device…");
          setRunning({ key: request.key, plan });
        },
        (error: unknown) => release(request.key, `error: ${String(error)}`),
      );
    },
    [record, release],
  );

  const onOutcome = useCallback(
    (outcome: string) => {
      if (running) release(running.key, outcome);
    },
    [running, release],
  );

  const deviceVerify = useMemo(() => ({ verify, outcomes }), [verify, outcomes]);
  const execution = useMemo(
    () => (running ? { key: running.key, plan: running.plan, onOutcome } : null),
    [running, onOutcome],
  );

  return { deviceVerify, execution };
}
