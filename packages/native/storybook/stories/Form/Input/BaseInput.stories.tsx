import { storiesOf } from "../../storiesOf";
import { boolean, text } from "@storybook/addon-knobs";
import React, { useState } from "react";
import Button from "../../../../src/components/cta/Button";
import Input, {
  InputRenderLeftContainer,
  InputRenderRightContainer,
  CommonProps,
} from "../../../../src/components/Form/Input/BaseInput";

const BaseInputStory = () => {
  const [value, setValue] = useState("");

  const onChangeText = (value: string) => setValue(value);

  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={"Placeholder"}
      disabled={boolean("disabled", false)}
      error={text("error", "")}
    />
  );
};

const BaseInputRenderSideExempleStory = () => {
  const [value, setValue] = useState("test@ledger.fr");
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const onChangeText = (value: string) => setValue(value);

  const renderLeft = (
    <InputRenderLeftContainer>
      <Button onPress={() => setDisabled(!disabled)}>disable</Button>
    </InputRenderLeftContainer>
  );
  const renderRight = (props: CommonProps) => {
    return (
      <InputRenderRightContainer>
        <Button
          onPress={() => setError(error ? "" : "Error message")}
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
      onChangeText={onChangeText}
      renderLeft={renderLeft}
      renderRight={renderRight}
      placeholder={"test"}
      disabled={disabled}
      error={error}
    />
  );
};

storiesOf((story) =>
  story("Form/Input/BaseInput", module)
    .add("BaseInput", BaseInputStory)
    .add("RenderSideExemple", BaseInputRenderSideExempleStory)
);
