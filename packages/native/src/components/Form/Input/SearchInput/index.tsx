import React from "react";
import { TextInput } from "react-native";
import styled from "styled-components/native";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import SearchMedium from "@ledgerhq/icons-ui/native/SearchMedium";

const Icon = styled(SearchMedium).attrs((p) => ({
  color: p.theme.colors.neutral.c70,
}))``;

function SearchInput(
  props: InputProps,
  ref?: React.ForwardedRef<TextInput>
): JSX.Element {
  return (
    <Input
      ref={ref}
      {...props}
      renderLeft={
        <InputRenderLeftContainer>
          <Icon />
        </InputRenderLeftContainer>
      }
    />
  );
}

export default React.forwardRef(SearchInput);
