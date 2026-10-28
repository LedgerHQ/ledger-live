import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Button, Spinner } from "@ledgerhq/lumen-ui-react";
import { useDeviceInteractionVisible } from "../deviceInteractionContext";

const StackedContext = createContext(false);

/** Lays out the actions below it as button-over-content, for narrow containers such as a sidebar. */
export function StackedActionables({ children }: { children: React.ReactNode }) {
  return <StackedContext.Provider value>{children}</StackedContext.Provider>;
}

export function Actionable<I extends Array<unknown>, A>({
  inputs,
  action,
  valueDisplay,
  buttonTitle,
  setValue,
  value,
  children,
  reverseRow,
  primary,
  destructive,
  label,
  actionLabel,
  buttonProps,
}: {
  buttonTitle: string;
  inputs: I | null;
  action: (...inputs: I) => Promise<A> | A;
  valueDisplay?: (value: A) => React.ReactNode;
  value?: A | null;
  setValue?: (value: A | null) => void;
  children?: React.ReactNode;
  reverseRow?: boolean;
  /** Highlights the action as the next step of the flow. */
  primary?: boolean;
  /** Marks the action as destructive: error-colored label instead of a filled button. */
  destructive?: boolean;
  /** Caption of the field when stacked; defaults to `buttonTitle`. */
  label?: string;
  /** Button text when stacked; defaults to "Apply". */
  actionLabel?: string;
  buttonProps?: { [key: string]: any };
}) {
  const enabled = !!inputs;
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value !== null && value !== undefined) {
      setError(null);
    }
  }, [value]);

  const onClick = useCallback(() => {
    if (!inputs) return;
    setLoading(true);
    Promise.resolve()
      .then(() => action(...inputs))
      .then(
        value => {
          if (setValue) setValue(value);
          setError(null);
        },
        error => {
          if (setValue) setValue(null);
          console.error(error);
          if (error && error.message?.includes("Ledger device: UNKNOWN_APDU (0x6d02)")) {
            setError(new Error("Error: Make sure you opened the Ledger Sync app on your device."));
            return;
          }
          setError(error);
        },
      )
      .finally(() => {
        setLoading(false);
      });
  }, [inputs, action, setValue]);
  const display =
    value !== null && value !== undefined && valueDisplay ? valueDisplay(value) : null;
  return (
    <RenderActionable
      enabled={enabled}
      error={error}
      loading={loading}
      onClick={onClick}
      display={display}
      buttonTitle={buttonTitle}
      reverseRow={reverseRow}
      primary={primary}
      destructive={destructive}
      label={label}
      actionLabel={actionLabel}
      buttonProps={buttonProps}
    >
      {children}
    </RenderActionable>
  );
}

export function RenderActionable({
  enabled,
  error,
  loading,
  onClick,
  display,
  buttonTitle,
  children,
  reverseRow,
  primary,
  destructive,
  label,
  actionLabel,
  buttonProps,
}: {
  enabled: boolean;
  error: Error | null;
  loading: boolean;
  onClick: () => void;
  display: React.ReactNode | null;
  buttonTitle: string;
  children?: React.ReactNode;
  reverseRow?: boolean;
  primary?: boolean;
  destructive?: boolean;
  label?: string;
  actionLabel?: string;
  buttonProps?: { [key: string]: any };
}) {
  const deviceOverlayVisible = useDeviceInteractionVisible();
  const showInlineSpinner = loading && !deviceOverlayVisible;
  const stacked = useContext(StackedContext);

  if (stacked) {
    // A settings field: caption, then the control, with a compact apply button only when needed.
    return (
      <div className="my-16 flex flex-col gap-8">
        <div className="flex min-h-[32px] items-center justify-between gap-8">
          <span className="body-3-semi-bold text-muted">{label ?? buttonTitle}</span>
          <span className="inline-flex items-center gap-8">
            {showInlineSpinner ? <Spinner size={12} className="text-muted" /> : null}
            {enabled || loading ? (
              <Button
                size="sm"
                appearance="accent"
                disabled={loading}
                onClick={onClick}
                {...buttonProps}
              >
                {actionLabel ?? "Apply"}
              </Button>
            ) : null}
          </span>
        </div>
        {children}
        {display ? (
          <div className={children ? "body-4 truncate text-muted" : "min-w-0"}>{display}</div>
        ) : null}
        {error ? <span className="text-error body-3">{error.message}</span> : null}
      </div>
    );
  }

  return (
    <div
      className={`my-8 flex items-center gap-16 ${reverseRow ? "flex-row-reverse" : "flex-row"}`}
    >
      <span className="relative inline-flex min-w-[260px] shrink-0 items-center gap-8">
        <Button
          size="sm"
          // A filled button stays readable when disabled, unlike a transparent one on a dark canvas.
          appearance={primary && enabled ? "accent" : "gray"}
          className={`w-full ${destructive && enabled ? "text-error" : ""} ${
            !enabled ? "text-muted" : ""
          }`}
          disabled={!enabled || loading}
          onClick={onClick}
          {...buttonProps}
        >
          {buttonTitle}
        </Button>
        {showInlineSpinner ? <Spinner size={12} className="text-muted" /> : null}
      </span>
      {display ? (
        <code className="flex-1 bg-muted rounded-md px-8 py-6 body-3 text-base truncate">
          {display}
        </code>
      ) : null}
      {error ? <span className="text-error body-3 px-8">{error.message}</span> : null}
      {children}
    </div>
  );
}
