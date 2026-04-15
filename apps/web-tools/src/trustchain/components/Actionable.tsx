import React, { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@ledgerhq/lumen-ui-react";
import { useDeviceInteractionVisible } from "../deviceInteractionContext";

export function Actionable<I extends Array<unknown>, A>({
  inputs,
  action,
  valueDisplay,
  buttonTitle,
  setValue,
  value,
  children,
  reverseRow,
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
  buttonProps?: { [key: string]: any };
}) {
  const deviceOverlayVisible = useDeviceInteractionVisible();
  const showInlineSpinner = loading && !deviceOverlayVisible;

  return (
    <div className={`flex items-center gap-8 my-4 ${reverseRow ? "flex-row-reverse" : "flex-row"}`}>
      <span className="relative inline-flex items-center gap-6">
        <Button
          size="sm"
          appearance="transparent"
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
