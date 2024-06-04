import React, { useCallback, useState } from "react";
import styled from "styled-components";

const Label = styled.div`
  display: block;
  padding: 10px 0;
  margin: 10px 0;
  button {
    margin-right: 10px;
  }
`;

const ValueDisplay = styled.code`
  padding: 10px;
  margin: 10px 0;
  background: #f0f0f0;
`;

const ErrorDisplay = styled.div`
  padding: 10px;
  margin: 10px 0;
  color: red;
`;

const Button = styled.button<{ error?: boolean }>`
  padding: 10px;
  margin: 10px 0;
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
  // inputs must all be truthly for the button to enables
  inputs: I | null;
  // if action fails, the error is going to be used for display
  action: (...inputs: I) => Promise<A>;
  // how to display the value
  valueDisplay: (value: A) => React.ReactNode;
  // in control style, we can provide a value and a setter
  value: A | null;
  setValue: (value: A | null) => void;
}) {
  const enabled = !!inputs;
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(() => {
    if (!inputs) return;
    setLoading(true);
    action(...inputs)
      .then(
        value => {
          setValue(value);
        },
        error => {
          setValue(null);
          console.error(error);
          setError(error);
        },
      )
      .finally(() => {
        setLoading(false);
      });
  }, [inputs, action, setValue]);
  const display = value ? valueDisplay(value) : null;
  return (
    <Label>
      <Button error={!!error} disabled={!enabled || loading} onClick={onClick}>
        {buttonTitle}
      </Button>
      {display && <ValueDisplay>{display}</ValueDisplay>}
      {error && <ErrorDisplay>{error.message}</ErrorDisplay>}
    </Label>
  );
}
