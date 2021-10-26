import React from "react";
import styled from "styled-components/native";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import SearchMedium from "../../../../assets/icons/SearchMedium";

const Icon = styled(SearchMedium).attrs((p) => ({
  color: p.theme.colors.palette.neutral.c70,
}))``;

export default function SearchInput(props: InputProps): JSX.Element {
  return (
    <Input
      {...props}
      renderLeft={
        <InputRenderLeftContainer>
          <Icon />
        </InputRenderLeftContainer>
      }
    />
  );
}
