import React, { useState, useCallback } from "react";
import styled from "styled-components";
import noop from "lodash/noop";
import Box from "~/renderer/components/Box";
import Input, { Props as InputProps } from "~/renderer/components/Input";
import IconEye from "~/renderer/icons/Eye";
import IconEyeOff from "~/renderer/icons/EyeOff";

const InputRight = styled(Box).attrs(() => ({
  color: "neutral.c70",
  justifyContent: "center",
  pr: 3,
}))`
  &:hover {
    color: ${p => p.theme.colors.neutral.c80};
  }
`;

type Props = {
  onChange?: (v: string) => void;
  value?: string;
  withStrength?: boolean;
} & Omit<InputProps, "onChange" | "value">;

const InputPassword = ({ onChange = noop, value = "", ...props }: Props) => {
  const [inputType, setInputType] = useState<"text" | "password">("password");

  const toggleInputType = useCallback(() => {
    setInputType(prev => (prev === "text" ? "password" : "text"));
  }, []);

  const handleChange = useCallback(
    (v: string) => {
      onChange(v);
    },
    [onChange],
  );

  return (
    <Box flow={1}>
      <Input
        {...props}
        type={inputType}
        value={value}
        onChange={handleChange}
        renderRight={
          <InputRight
            onClick={toggleInputType}
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
};

export default InputPassword;
