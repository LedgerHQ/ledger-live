import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@ledgerhq/lumen-design-core/cn";
import { Banner, Button, TextInput } from "@ledgerhq/lumen-ui-react";

export function Actionable<I extends Array<unknown>, A>({
  inputs,
  action,
  valueDisplay,
  buttonTitle,
  setValue,
  value,
  className,
  children,
}: Readonly<{
  buttonTitle: string;
  inputs: I | null;
  action: (...inputs: I) => Promise<A> | A;
  valueDisplay?: (value: A) => string;
  value?: A | null;
  setValue?: (value: A | null) => void;
  className?: string;
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
    <div className={cn("flex flex-col gap-8 px-16 py-8", className)}>
      <div className="flex items-center gap-8">
        <Button
          size="sm"
          appearance="gray"
          loading={loading}
          disabled={!inputs || loading}
          onClick={onClick}
        >
          {buttonTitle}
        </Button>
        {children}
      </div>
      {display ? (
        <TextInput
          multiline
          readOnly
          label="Result"
          minLines={1}
          maxLines={10}
          value={display}
          className="[&_textarea]:font-mono"
          hideClearButton
        />
      ) : null}
      {error ? <Banner appearance="error" description={error.message} /> : null}
    </div>
  );
}
