import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { ALL_TYPES_VALUE, type HistoryTypeFilter } from "../utils/operationTypeOptions";

const HISTORY_TYPE_QUERY = "type";

function parseTypeFilter(searchParams: URLSearchParams): HistoryTypeFilter {
  const raw = searchParams.get(HISTORY_TYPE_QUERY);
  if (!raw || raw === ALL_TYPES_VALUE) return ALL_TYPES_VALUE;
  return raw as HistoryTypeFilter;
}

export function useHistoryTypeFilter(): {
  selectedType: HistoryTypeFilter;
  setSelectedType: (type: HistoryTypeFilter) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = useMemo(() => parseTypeFilter(searchParams), [searchParams]);

  const setSelectedType = useCallback(
    (type: HistoryTypeFilter) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (type === ALL_TYPES_VALUE) {
          next.delete(HISTORY_TYPE_QUERY);
        } else {
          next.set(HISTORY_TYPE_QUERY, type);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  return { selectedType, setSelectedType };
}