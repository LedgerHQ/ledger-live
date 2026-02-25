import React, { useEffect, useRef, ChangeEvent } from "react";
import { SearchInput as LumenSearch } from "@ledgerhq/lumen-ui-react";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";

type SearchProps = {
  value: string;
  placeholder?: string;
  debounceTime?: number;
  autoFocus?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onDebouncedChange?: (current: string, prev: string) => void;
  "data-testid"?: string;
};

export const Search = ({
  value,
  placeholder,
  debounceTime = 500,
  autoFocus = true,
  onChange,
  onDebouncedChange,
  "data-testid": dataTestId,
}: SearchProps) => {
  const prevValueRef = useRef(value);

  const debouncedValue = useDebounce(value, debounceTime);

  useEffect(() => {
    if (onDebouncedChange && debouncedValue !== prevValueRef.current) {
      onDebouncedChange(debouncedValue, prevValueRef.current);
      prevValueRef.current = debouncedValue;
    }
  }, [debouncedValue, onDebouncedChange]);

  return (
    <LumenSearch
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      data-testid={dataTestId}
    />
  );
};

Search.displayName = "Search";
