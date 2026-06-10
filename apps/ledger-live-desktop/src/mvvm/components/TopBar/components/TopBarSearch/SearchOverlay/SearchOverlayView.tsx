import React, { ChangeEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@ledgerhq/lumen-ui-react";
import { SearchInputView } from "../SearchInputView";
import SearchOverlayContext from "./SearchOverlayContext";
import { SearchOverlayDefault } from "./content/SearchOverlayDefault";
import { SearchResultsList } from "./content/SearchResultsList";
import { SearchEmptyState } from "./content/SearchEmptyState";
import { SearchMode, SearchOverlayContextValue } from "./types";

const side = "bottom";
const align = "start";

type SearchOverlayViewProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onChangeQuery: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  mode: SearchMode;
  contextValue: SearchOverlayContextValue;
}>;

type SearchOverlayContentProps = Readonly<{
  mode: SearchMode;
  query: string;
}>;

function SearchOverlayContent({ mode, query }: SearchOverlayContentProps) {
  switch (mode) {
    case "results":
      return <SearchResultsList />;
    case "noResults":
      return <SearchEmptyState query={query} />;
    case "suggestions":
    default:
      return <SearchOverlayDefault />;
  }
}

export function SearchOverlayView({
  open,
  onOpenChange,
  query,
  onChangeQuery,
  onKeyDown,
  mode,
  contextValue,
}: SearchOverlayViewProps) {
  const { t } = useTranslation();

  return (
    <Popover overlay open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <SearchInputView
            value={query}
            placeholder={t("topBar.searchPlaceholder")}
            onChange={onChangeQuery}
            onKeyDown={onKeyDown}
            testId="topbar-search-input"
          />
        }
      />
      <PopoverContent
        side={side}
        align={align}
        width="fit"
        className="w-[var(--anchor-width)] flex flex-col gap-12"
      >
        <SearchOverlayContext.Provider value={contextValue}>
          <div className="flex flex-col gap-12" data-testid="topbar-search-popover">
            <SearchOverlayContent mode={mode} query={query} />
          </div>
        </SearchOverlayContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
