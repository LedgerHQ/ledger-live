import React, { PureComponent } from "react";
import styled from "styled-components";
import { withTranslation, TFunction } from "react-i18next";
import zxcvbn from "zxcvbn";
import debounce from "lodash/debounce";
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

const Strength = styled(Box).attrs<{
  activated: boolean;
  warning: boolean;
}>(p => ({
  bg: p.activated ? (p.warning ? "alertRed" : "positiveGreen") : "palette.divider",
  grow: true,
}))<{
  activated: boolean;
  warning: boolean;
}>`
  border-radius: 13px;
  height: 4px;
`;

type WarningProps = {
  passwordStrength: zxcvbn.ZXCVBNScore;
};

const Warning = styled(Box).attrs<WarningProps>(p => ({
  alignItems: "flex-end",
  color: p.passwordStrength <= 1 ? "alertRed" : "positiveGreen",
  ff: "Inter|SemiBold",
  fontSize: 3,
}))<WarningProps>``;

const getPasswordStrength = (v: string) => zxcvbn(v).score;

type State = {
  inputType: "text" | "password";
  passwordStrength: zxcvbn.ZXCVBNScore;
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
    passwordStrength: getPasswordStrength(this.props.value),
  };

  componentWillUnmount() {
    this._isUnmounted = true;
  }

  _isUnmounted = false;
  toggleInputType = () =>
    this.setState(prev => ({
      inputType: prev.inputType === "text" ? "password" : "text",
    }));

  debouncePasswordStrength = debounce(v => {
    if (this._isUnmounted) return;
    this.setState({
      passwordStrength: getPasswordStrength(v),
    });
  }, 150);

  handleChange = (v: string) => {
    const { onChange } = this.props;
    onChange(v);
    this.debouncePasswordStrength(v);
  };

  render() {
    const { t, value, withStrength } = this.props;
    const { passwordStrength, inputType } = this.state;
    const hasValue = value.trim() !== "";
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
        {withStrength && (
          <>
            <Box flow={1} horizontal>
              {[0, 1, 2].map(v => (
                <Strength
                  key={v}
                  warning={passwordStrength <= 1}
                  activated={hasValue && passwordStrength >= v}
                />
              ))}
            </Box>
            {hasValue && (
              <Warning passwordStrength={passwordStrength}>
                {t(`password.warning_${passwordStrength}`)}
              </Warning>
            )}
          </>
        )}
      </Box>
    );
  }
}
export default withTranslation()(InputPassword);
