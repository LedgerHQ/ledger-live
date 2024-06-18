import React, { useCallback, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

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

const rotate = keyframes`
  from {transform: translate(-50%, -50%) rotate(0deg);}
  to {transform: translate(-50%, -50%) rotate(360deg);}
`;

const Spinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAyVBMVEUAAAC9vsDCw8W9v8G9vsD29/fr7O29vsDm5+jx8fK/wML29vf///+9vsHR0tPm5+jt7u7w8PHr7Ozc3d7n6OnExcfGx8nJyszMzM7V1tjZ2tvf4OG9vsDHyMrp6uvIycu9v8HAwcTPz9HCw8W9vsC9vsDBwsTj5OXj5OXW19i9vsDm5+jw8PHy8vL09fW9vsDFxsjJyszAwsS9vsDU1dbLzM7Y2drb3N3c3d7e3+DHyMrBwsTh4uPR0tPDxcfa293R0tTV1ti9vsAll6RJAAAAQnRSTlMA7+t/MAZHQDYjHxABv6xSQjEgFgzi2M7Emop0cGVLD/ryt7Cfj3dmYWBgWjgsGd/Cv7SvopSSg4B6eHZrQjkyKx1dd0xhAAAA9klEQVR4AYWPeXOCMBBHFxIgCQKC3KCo1Wprtfd98/0/VBPb6TC0Wd+/783+ZqELrQkRoIMujFbiaLTwpESC029reB7919d7u6SgYaE8aUCivW84oEUY0lPQc408pxBqHxCIHGiw4Lxtl5h35ALFglouAAaZTj00OJ7NrvDANI/Q4PlQMDbNFA3ekiQRaHGRpmM0eMqyyxgLRlme4ydu8/n8Az3h+37xiRWv/k1RRlhxUtyVD8yCXwaDflHeP1Zr5sIey3WtfvFeVS+rTWAzFobhNhrFf4omWK03wcS2h8OzLd/1TyhiNvkJQu5amocjznm0i6HDF1RMG1aMA/PYAAAAAElFTkSuQmCC");
  background-size: cover;
  z-index: 1;
  animation: ${rotate} 1s linear infinite;
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
