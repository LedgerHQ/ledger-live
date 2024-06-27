import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Spinner } from "./Spinner";

const Label = styled.div`
  display: flex;
  align-items: center;
  padding: 0px 0;
  margin: 5px 0;
  button {
    margin: 2px 8px;
  }
`;

const ValueDisplay = styled.code`
  flex: 1;
  padding: 10px;
  background: #f0f0f0;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
  overflow: hidden;
`;

const ErrorDisplay = styled.div`
  padding: 10px;
  margin: 5px 0;
  color: red;
`;

const Button = styled.button`
  padding: 10px;
`;

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
  // inputs or null if not enabled
  inputs: I | null;
  // if action fails, the error is going to be used for display
  action: (...inputs: I) => Promise<A> | A;
  // how to display the value
  valueDisplay?: (value: A) => React.ReactNode;
  // in control style, we can provide a value and a setter
  value?: A | null;
  setValue?: (value: A | null) => void;
  children?: React.ReactNode;
  reverseRow?: boolean;
  buttonProps?: { [key: string]: any };
}) {
  const enabled = !!inputs;
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  // if value is set, error should disappear
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
  return (
    <Label
      style={{
        flexDirection: reverseRow ? "row-reverse" : "row",
      }}
    >
      <span style={{ position: "relative" }}>
        <Button disabled={!enabled || loading} onClick={onClick} {...buttonProps}>
          {buttonTitle}
        </Button>
        {loading ? <Spinner /> : null}
      </span>
      {display ? <ValueDisplay>{display}</ValueDisplay> : null}
      {error ? <ErrorDisplay>{error.message}</ErrorDisplay> : null}
      {children}
    </Label>
  );
}
