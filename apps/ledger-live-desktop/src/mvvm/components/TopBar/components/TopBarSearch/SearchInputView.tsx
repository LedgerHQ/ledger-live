import React, { ChangeEvent, ComponentPropsWithoutRef, KeyboardEvent, forwardRef } from "react";
import { SearchInput } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type SearchInputViewProps = {
  value: string;
  placeholder: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  testId?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "onChange" | "onKeyDown">;

export const SearchInputView = forwardRef<HTMLDivElement, SearchInputViewProps>(
  function SearchInputView(
    { value, placeholder, onChange, onKeyDown, testId, className, ...rest },
    ref,
  ) {
    return (
      <div ref={ref} className={cn("min-w-0 max-w-[450px] flex-auto mr-24", className)} {...rest}>
        <SearchInput
          appearance="transparent"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          data-testid={testId}
        />
      </div>
    );
  },
);
