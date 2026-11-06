import { useEffect, type ReactNode } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { PredictionsOnboardingState, PredictionsToolProps } from "../types";
import { describeAddress, describeVersions, RESETS, setupPreviews } from "./describe";
import { useAction } from "./useAction";

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-8">
      <h3 className="body-2-semi-bold text-base">{title}</h3>
      {children}
    </section>
  );
}

function Environment({
  state,
  isRunning,
  onReset,
}: Readonly<{
  state: PredictionsOnboardingState;
  isRunning: boolean;
  onReset: (reset: (typeof RESETS)[number]) => void;
}>) {
  return (
    <Section title={`${state.label} (${state.manifestId})`}>
      {state.isStored ? (
        <>
          <p className="body-3 text-muted">Documents: {describeVersions(state.acceptedVersions)}</p>
          {state.addresses.length === 0 ? (
            <p className="body-3 text-muted">Accounts: none</p>
          ) : (
            state.addresses.map(linked => (
              <p key={linked.address} className="body-3 break-all text-muted">
                {describeAddress(linked)}
              </p>
            ))
          )}
        </>
      ) : (
        <p className="body-3 text-muted">Nothing stored: the next open is a first open.</p>
      )}
      <div className="flex flex-wrap gap-8">
        {RESETS.map(reset => (
          <Button
            key={reset.what}
            appearance="gray"
            size="sm"
            disabled={isRunning || !reset.isAvailable(state)}
            onClick={() => onReset(reset)}
          >
            {reset.label}
          </Button>
        ))}
      </div>
      {state.raw === undefined ? null : (
        <details>
          <summary className="body-3 cursor-pointer text-muted">Stored value</summary>
          <pre className="body-4 whitespace-pre-wrap break-all text-muted">{state.raw}</pre>
          <Button
            appearance="transparent"
            size="sm"
            // On desktop the tool renders in its own window: only that window's clipboard is focused.
            onClick={event =>
              void event.currentTarget.ownerDocument.defaultView?.navigator.clipboard.writeText(
                state.raw ?? "",
              )
            }
          >
            Copy
          </Button>
        </details>
      )}
    </Section>
  );
}

export default function Predictions({
  hasSeenIntro,
  setIntroSeen,
  onboardingStates,
  refresh,
  reset,
  replayWholeOnboarding,
  setupFailureReasons,
  previewSetup,
}: PredictionsToolProps) {
  const { isRunning, outcome, run } = useAction();

  useEffect(() => {
    run(refresh);
  }, [run, refresh]);

  return (
    <div className="flex flex-col gap-24 p-16">
      <Section title="Onboarding">
        <p className="body-3 text-muted">Intro: {hasSeenIntro ? "seen" : "not seen"}</p>
        <div className="flex flex-wrap gap-8">
          <Button appearance="gray" size="sm" onClick={() => setIntroSeen(!hasSeenIntro)}>
            {hasSeenIntro ? "Show the intro again" : "Mark the intro as seen"}
          </Button>
          <Button
            appearance="base"
            size="sm"
            disabled={isRunning}
            onClick={() =>
              run(replayWholeOnboarding, "Done. Reopen Predictions to replay the whole onboarding.")
            }
          >
            Replay the whole onboarding
          </Button>
          <Button
            appearance="transparent"
            size="sm"
            disabled={isRunning}
            onClick={() => run(refresh, "Refreshed.")}
          >
            Refresh
          </Button>
        </div>
      </Section>
      {onboardingStates.map(state => (
        <Environment
          key={state.manifestId}
          state={state}
          isRunning={isRunning}
          onReset={({ what, done }) =>
            run(
              () => reset(state.manifestId, what),
              `Done. Reopen Predictions on ${state.label}: ${done}`,
            )
          }
        />
      ))}
      <Section title="Trading wallet setup">
        <p className="body-3 text-muted">
          Opens Ledger Wallet&apos;s setup as after a binding, then shows the outcome.
        </p>
        <div className="flex flex-wrap gap-8">
          {setupPreviews(setupFailureReasons).map(({ label, preview }) => (
            <Button key={label} appearance="gray" size="sm" onClick={() => previewSetup(preview)}>
              {label}
            </Button>
          ))}
        </div>
      </Section>
      {outcome ? (
        <p className={`body-3 ${outcome.isError ? "text-error" : "text-success"}`}>
          {outcome.message}
        </p>
      ) : null}
    </div>
  );
}
