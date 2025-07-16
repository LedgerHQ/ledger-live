import React, { useMemo, useRef } from "react";
import { Icons } from "../../../assets";
import { useDebouncedCallback } from "../../hooks";
import { Input } from "..";
import { NativeSyntheticEvent, TextInputChangeEventData, TextInputProps } from "react-native";

type Props = Readonly<
  TextInputProps & {
    onDebouncedChange?: (current: string, prev: string) => void;
    debounceTime?: number;
  }
>;

export function Search({ onDebouncedChange, debounceTime = 500, onChange, ...props }: Props) {
  const initialValue = props.value ?? props.defaultValue ?? "";
  const prevValue = useRef(String(initialValue));

  const handleDebouncedChange = useDebouncedCallback(
    useMemo(() => {
      if (!onDebouncedChange) return;
      return (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        const current = e.nativeEvent.text;
        onDebouncedChange(current, prevValue.current);
        prevValue.current = current;
      };
    }, [onDebouncedChange]),
    debounceTime,
  );

  const handleChange = useMemo(() => {
    if (!handleDebouncedChange && !onChange) return;
    return (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
      onChange?.(e);
      handleDebouncedChange?.(e);
    };
  }, [handleDebouncedChange, onChange]);

  return <Input {...props} icon={Icons.Search} onChange={handleChange} />;
}
