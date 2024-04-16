import React, { PureComponent } from "react";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import noop from "lodash/noop";
import Box from "~/renderer/components/Box";
import Input, { Props as InputProps } from "~/renderer/components/Input";
import IconEye from "~/renderer/icons/Eye";
import IconEyeOff from "~/renderer/icons/EyeOff";

const InputRight = styled(Box).attrs(() => ({
  color: "palette.text.shade60",
  justifyContent: "center",
  pr: 3,
}))`
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade80};
  }
`;

type State = {
  inputType: "text" | "password";
};

type Props = {
  onChange: (v: string) => void;
  t: TFunction;
  value: string;
  withStrength?: boolean;
} & InputProps;

class InputPassword extends PureComponent<Props, State> {
  static defaultProps = {
    onChange: noop,
    value: "",
  };

  state: State = {
    inputType: "password",
  };

  componentWillUnmount() {
    this._isUnmounted = true;
  }

  _isUnmounted = false;
  toggleInputType = () =>
    this.setState(prev => ({
      inputType: prev.inputType === "text" ? "password" : "text",
    }));

  handleChange = (v: string) => {
    const { onChange } = this.props;
    onChange(v);
  };

  render() {
    const { inputType } = this.state;
    return (
      <Box flow={1}>
        <Input
          {...this.props}
          type={inputType}
          onChange={this.handleChange}
          renderRight={
            <InputRight
              onClick={this.toggleInputType}
              style={{
                cursor: "default",
              }}
            >
              {inputType === "password" ? <IconEye size={16} /> : <IconEyeOff size={16} />}
            </InputRight>
          }
        />
      </Box>
    );
  }
}
export default withTranslation()(InputPassword);
