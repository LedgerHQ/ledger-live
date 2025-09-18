import React, { useMemo, useRef } from "react";
import { Icons } from "../../../assets";
import { useDebouncedCallback } from "../../hooks";
import { Input } from "..";
import { NativeSyntheticEvent, TextInputChangeEventData, TextInputProps } from "react-native";

type Props = Readonly<
  TextInputProps & {
    onDebouncedChange?: (current: string, prev: string) => void;
    debounceTime?: number;
    onPressIn?: () => void;
  }
>;

export function Search({
  onDebouncedChange,
  debounceTime = 500,
  onChange,
  onPressIn,
  ...props
}: Props) {
  const initialValue = props.value ?? props.defaultValue ?? "";
  const prevValue = useRef(String(initialValue));

  const handleDebouncedChange = useDebouncedCallback(
    useMemo(() => {
      if (!onDebouncedChange) return;
      return (current: string) => {
        onDebouncedChange(current, prevValue.current);
        prevValue.current = current;
      };
    }, [onDebouncedChange]),
    debounceTime,
  );

  const handleChange = useMemo(() => {
    if (!handleDebouncedChange && !onChange) return;
    return (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const current = e.nativeEvent.text;
      onChange?.(e);
      handleDebouncedChange?.(current);
    };
  }, [handleDebouncedChange, onChange]);

  return (
    <Input
      {...props}
      style={{ height: "100%" }}
      icon={Icons.Search}
      onChange={handleChange}
      onPressIn={onPressIn}
    />
  );
}
