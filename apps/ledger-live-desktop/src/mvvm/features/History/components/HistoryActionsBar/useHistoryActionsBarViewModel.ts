import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";

export type HistoryActionsBarViewModel = {
  onExportCsv: () => void;
};

export function useHistoryActionsBarViewModel(): HistoryActionsBarViewModel {
  const dispatch = useDispatch();

  const onExportCsv = useCallback(() => {
    dispatch(openModal("MODAL_EXPORT_OPERATIONS", undefined));
  }, [dispatch]);

  return { onExportCsv };
}
