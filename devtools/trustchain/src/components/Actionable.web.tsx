import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, Spinner } from "@ledgerhq/lumen-ui-react";

export function Actionable<I extends Array<unknown>, A>({
  inputs,
  action,
  valueDisplay,
  buttonTitle,
  setValue,
  value,
  children,
}: Readonly<{
  buttonTitle: string;
  inputs: I | null;
  action: (...inputs: I) => Promise<A> | A;
  valueDisplay?: (value: A) => ReactNode;
  value?: A | null;
  setValue?: (value: A | null) => void;
  children?: ReactNode;
}>) {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value != null) setError(null);
  }, [value]);

  const onClick = useCallback(() => {
    if (!inputs) return;
    setLoading(true);
    Promise.resolve()
      .then(() => action(...inputs))
      .then(
        result => {
          setValue?.(result);
          setError(null);
        },
        err => {
          const msg: string = err?.message ?? String(err);
          setError(
            new Error(
              msg.includes("UNKNOWN_APDU (0x6d02)")
                ? "Make sure the Ledger Sync app is open on your device."
                : msg,
            ),
          );
        },
      )
      .finally(() => setLoading(false));
  }, [inputs, action, setValue]);

  const display = value != null && valueDisplay ? valueDisplay(value) : null;

  return (
    <div className="flex items-center gap-8 my-4 flex-row">
      <span className="relative inline-flex items-center gap-6">
        <Button size="sm" appearance="transparent" disabled={!inputs || loading} onClick={onClick}>
          {buttonTitle}
        </Button>
        {loading ? <Spinner size={12} className="text-muted" /> : null}
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
