import React, { ChangeEvent, useMemo, useRef } from "react";
import { Icons } from "../../../assets";
import { useDebouncedCallback } from "../../hooks";
import { Input } from "..";

type InputProps = React.ComponentProps<"input">;
type Props = Readonly<
  InputProps & {
    onDebouncedChange?: (current: string, prev: string) => void;
    debounceTime?: number;
  }
>;

export function Search({ onDebouncedChange, debounceTime = 500, onChange, ...props }: Props) {
  const initialValue = props.value ?? props.defaultValue ?? "";
  const prevValue = useRef(String(initialValue));

  const handleDebouncedChange = useDebouncedCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!onDebouncedChange) return;
    const current = event.target.value;
    onDebouncedChange(current, prevValue.current);
    prevValue.current = current;
  }, debounceTime);

  const handleChange = useMemo(() => {
    if (!handleDebouncedChange && !onChange) return;
    return (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      handleDebouncedChange?.(event);
    };
  }, [handleDebouncedChange, onChange]);

  return <Input {...props} icon={<Icons.Search size="S" />} onChange={handleChange} />;
}
