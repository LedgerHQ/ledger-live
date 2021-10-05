import { storiesOf } from "@storybook/react-native";
import { boolean, text, withKnobs } from "@storybook/addon-knobs";
import React, { useState } from "react";
import Button from "@components/cta/Button";
import CenterView from "../../CenterView";
import Input, {
  InputRenderLeftContainer,
  InputRenderRightContainer,
} from "@components/Form/Input/BaseInput";

const BaseInputStory = () => {
  const [value, setValue] = useState("");

  const onChangeText = (value) => setValue(value);

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
  const [error, setError] = React.useState(false);

  const onChangeText = (value) => setValue(value);

  const renderLeft = (
    <InputRenderLeftContainer>
      <Button onPress={() => setDisabled(!disabled)}>disable</Button>
    </InputRenderLeftContainer>
  );
  const renderRight = (props) => {
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

storiesOf("Form", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Input/BaseInput", () => <BaseInputStory />)
  .add("Input/BaseInput/RenderSideExemple", () => (
    <BaseInputRenderSideExempleStory />
  ));
