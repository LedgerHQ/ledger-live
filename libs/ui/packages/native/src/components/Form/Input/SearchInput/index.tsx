import React, { useCallback } from "react";
import { TextInput } from "react-native";
import styled from "styled-components/native";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import SearchMedium from "@ledgerhq/icons-ui/native/SearchMedium";
import Button from "../../../cta/Button";

const Icon = styled(SearchMedium).attrs((p) => ({
  color: p.theme.colors.neutral.c70,
}))``;

function SearchInput(
  { onChange, value, ...props }: InputProps,
  ref?: React.ForwardedRef<TextInput>,
): JSX.Element {
  const onClear = useCallback((): void => {
    if (onChange) {
      onChange("");
    }
  }, [onChange]);
  return (
    <Input
      ref={ref}
      onChange={onChange}
      value={value}
      {...props}
      renderLeft={
        <InputRenderLeftContainer>
          <Icon />
        </InputRenderLeftContainer>
      }
      renderRight={value ? <Button iconName="Close" onPress={onClear} /> : null}
    />
  );
}

export default React.forwardRef(SearchInput);
