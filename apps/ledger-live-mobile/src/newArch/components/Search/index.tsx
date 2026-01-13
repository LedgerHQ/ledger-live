import React, { useEffect, useRef } from "react";
import { TextInput } from "react-native";
import { SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";

type SearchProps = {
  value: string;
  placeholder?: string;
  debounceTime?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  onDebouncedChange?: (current: string, prev: string) => void;
  testID?: string;
  onPressIn?: () => void;
};

export const Search = ({
  onFocus,
  onBlur,
  value,
  placeholder,
  debounceTime = 500,
  onChange,
  onDebouncedChange,
  testID,
  onPressIn,
}: SearchProps) => {
  const inputRef = useRef<TextInput | null>(null);
  const prevValueRef = useRef(value);

  const debouncedValue = useDebounce(value, debounceTime);

  useEffect(() => {
    if (onDebouncedChange && debouncedValue !== prevValueRef.current) {
      onDebouncedChange(debouncedValue, prevValueRef.current);
      prevValueRef.current = debouncedValue;
    }
  }, [debouncedValue, onDebouncedChange]);

  return (
    <SearchInput
      onFocus={onFocus}
      onBlur={onBlur}
      onPressIn={onPressIn}
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      onChangeText={onChange}
      testID={testID}
    />
  );
};

Search.displayName = "Search";
