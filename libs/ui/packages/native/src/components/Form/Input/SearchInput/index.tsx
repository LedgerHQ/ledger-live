import React, { useCallback } from "react";
import { TextInput } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import Search from "@ledgerhq/icons-ui/native/Search";
import DeleteCircleFill from "@ledgerhq/icons-ui/native/DeleteCircleFill";
import Button from "../../../cta/Button";

const Icon = styled(Search).attrs((p) => ({
  color: p.theme.colors.neutral.c70,
}))``;

const Delete = styled(DeleteCircleFill).attrs((p) => ({
  color: p.theme.colors.opacityDefault.c50,
}))``;

function SearchInput(
  { onChange, value, ...props }: InputProps,
  ref?: React.ForwardedRef<TextInput> | null,
): JSX.Element {
  const theme = useTheme();
  const onClear = useCallback((): void => {
    onChange?.("");
  }, [onChange]);
  return (
    <Input
      ref={ref}
      onChange={onChange}
      value={value}
      hasBorder={false}
      inputContainerStyle={{
        backgroundColor: theme.colors.opacityDefault.c05,
        height: 40,
        paddingHorizontal: 12,
        paddingVertical: 0,
      }}
      baseInputContainerStyle={{ height: 40 }}
      {...props}
      renderLeft={
        <InputRenderLeftContainer>
          <Icon size="S" />
        </InputRenderLeftContainer>
      }
      renderRight={
        value ? (
          <Button
            Icon={<Delete size="S" />}
            isNewIcon
            onPress={onClear}
            style={{ width: "auto", marginLeft: 8 }}
          />
        ) : null
      }
    />
  );
}

export default React.forwardRef(SearchInput);
