import React, { useCallback, useState } from "react";
import styled from "styled-components";

const Label = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  padding: 0px 0;
  margin: 5px 0;
  button {
    margin-right: 10px;
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
}) {
  const enabled = !!inputs;
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
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
    />
  );
}

export function RenderActionable({
  enabled,
  error,
  loading,
  onClick,
  display,
  buttonTitle,
}: {
  enabled: boolean;
  error: Error | null;
  loading: boolean;
  onClick: () => void;
  display: React.ReactNode | null;
  buttonTitle: string;
}) {
  return (
    <Label>
      <Button disabled={!enabled || loading} onClick={onClick}>
        {buttonTitle}
      </Button>
      {display ? <ValueDisplay>{display}</ValueDisplay> : null}
      {error ? <ErrorDisplay>{error.message}</ErrorDisplay> : null}
    </Label>
  );
}
