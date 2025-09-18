import React, { ChangeEvent, useEffect, useMemo, useRef } from "react";
import { Icons } from "../../../assets";
import { useDebouncedCallback } from "../../hooks";
import { Input } from "..";
import styled from "styled-components";
import { withTokens } from "../../libs";

const Wrapper = styled.div`
  ${withTokens("colors-border-active-default", "radius-s")}

  :focus-within {
    box-shadow: inset 0 0 0 2px var(--colors-border-active-default);
  }
  border-radius: var(--radius-s, 8px);
`;

type InputProps = React.ComponentProps<"input">;
type Props = Readonly<
  InputProps & {
    onDebouncedChange?: (current: string, prev: string) => void;
    debounceTime?: number;
    autoFocus?: boolean;
  }
>;

export function Search({
  onDebouncedChange,
  debounceTime = 500,
  onChange,
  autoFocus = true,
  ...props
}: Props) {
  const initialValue = props.value ?? props.defaultValue ?? "";
  const prevValue = useRef(String(initialValue));
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      // Delay focus to prevent layout shifts
      setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 0);
    }
  }, [autoFocus]);

  const handleDebouncedChange = useDebouncedCallback(
    useMemo(() => {
      if (!onDebouncedChange) return;
      return (event: ChangeEvent<HTMLInputElement>) => {
        const current = event.target.value;
        onDebouncedChange(current, prevValue.current);
        prevValue.current = current;
      };
    }, [onDebouncedChange]),
    debounceTime,
  );

  const handleChange = useMemo(() => {
    if (!handleDebouncedChange && !onChange) return;
    return (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      handleDebouncedChange?.(event);
    };
  }, [handleDebouncedChange, onChange]);

  return (
    <Wrapper>
      <Input
        {...props}
        ref={searchInputRef}
        icon={<Icons.Search size="S" />}
        onChange={handleChange}
      />
    </Wrapper>
  );
}
