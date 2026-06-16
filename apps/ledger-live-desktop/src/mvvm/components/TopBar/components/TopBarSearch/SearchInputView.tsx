import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  KeyboardEvent,
  SyntheticEvent,
  forwardRef,
} from "react";
import { SearchInput } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type SearchInputViewProps = {
  value: string;
  placeholder: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  isOpen: boolean;
  testId?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "onChange" | "onKeyDown">;

export const SearchInputView = forwardRef<HTMLDivElement, SearchInputViewProps>(
  function SearchInputView(
    { value, placeholder, onChange, onKeyDown, isOpen, testId, className, ...rest },
    ref,
  ) {
    // While the overlay is open, clicks inside the search field (the input itself or the clear
    // button) must not bubble to the Popover trigger, which would otherwise toggle it closed and
    // reset the query. The first click (overlay closed) still propagates so it can open the overlay.
    const stopOverlayToggleWhenOpen = (e: SyntheticEvent) => {
      if (isOpen) {
        e.stopPropagation();
      }
    };

    return (
      <div ref={ref} className={cn("min-w-0 max-w-[450px] flex-auto mr-24", className)} {...rest}>
        <div onClick={stopOverlayToggleWhenOpen} onPointerDown={stopOverlayToggleWhenOpen}>
          <SearchInput
            appearance="transparent"
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onKeyDown={onKeyDown}
            data-testid={testId}
          />
        </div>
      </div>
    );
  },
);
