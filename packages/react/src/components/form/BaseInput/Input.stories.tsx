import React, { useState } from "react";
import Button from "../../cta/Button";
import Input, { InputProps, InputRenderLeftContainer, InputRenderRightContainer } from "./index";

export default {
  title: "Form/Input/Base",
  argTypes: {
    disabled: {
      type: "boolean",
      defaultValue: false,
    },
    error: {
      type: "string",
      defaultValue: undefined,
    },
    warning: {
      type: "string",
      defaultValue: undefined,
    },
  },
};

export const Base = (args: InputProps): JSX.Element => {
  const [value, setValue] = React.useState("");

  return <Input {...args} value={value} onChange={setValue} placeholder={"Placeholder"} />;
};

export const RenderSideExemple = (): JSX.Element => {
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = React.useState("");
  const [value, setValue] = React.useState("test@ledger.fr");

  const renderLeft = (
    <InputRenderLeftContainer>
      <Button type="main" outline onClick={() => setDisabled(!disabled)}>
        disable
      </Button>
    </InputRenderLeftContainer>
  );
  const renderRight = (props: { disabled: boolean }) => {
    return (
      <InputRenderRightContainer>
        <Button
          type="main"
          outline
          onClick={() => setError(error ? "" : "Error message")}
          /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
          // @ts-ignore
          disabled={props.disabled}
        >
          error
        </Button>
      </InputRenderRightContainer>
    );
  };

  return (
    <Input
      value={value}
      disabled={disabled}
      error={error}
      onChange={setValue}
      renderLeft={renderLeft}
      renderRight={renderRight}
      placeholder={"test"}
    />
  );
};
