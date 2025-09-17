import { ChangeEvent, useCallback, useState } from "react";

export type UseSearchParams = {
  /** Initial value to display in the search input */
  initialValue?: string;
  /** Persist the search value to the host app state (e.g., Redux) */
  onPersistSearchValue?: (value: string) => void;
  /** Track analytics when the debounced value changes and should be emitted */
  onTrackSearch?: (query: string) => void;
};

export type UseSearchResult = {
  handleSearch: (queryOrEvent: string | ChangeEvent<HTMLInputElement>) => void;
  handleDebouncedChange: (current: string, previous: string) => void;
  displayedValue: string | undefined;
};

const normalize = (value: string) => value.trim();

export function useSearchCommon({
  initialValue,
  onPersistSearchValue,
  onTrackSearch,
}: UseSearchParams): UseSearchResult {
  const [displayedValue, setDisplayedValue] = useState<string | undefined>(initialValue);

  const handleSearch = useCallback((queryOrEvent: string | ChangeEvent<HTMLInputElement>) => {
    const nextValue = typeof queryOrEvent === "string" ? queryOrEvent : queryOrEvent.target.value;
    setDisplayedValue(nextValue);
  }, []);

  const shouldEmitEvent = useCallback(
    (currentQuery: string, previousQuery: string) =>
      currentQuery !== "" && currentQuery !== previousQuery,
    [],
  );
  const handleDebouncedChange = useCallback(
    (current: string, previous: string) => {
      const currentQuery = normalize(current);
      const previousQuery = normalize(previous);

      onPersistSearchValue?.(currentQuery);

      if (!shouldEmitEvent(currentQuery, previousQuery)) return;

      onTrackSearch?.(currentQuery);
    },
    [onPersistSearchValue, onTrackSearch, shouldEmitEvent],
  );

  return { handleSearch, handleDebouncedChange, displayedValue };
}
