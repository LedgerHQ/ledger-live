import { useCallback, useMemo } from "react";
import {
  isSettingsDateFormat,
  type DateFormatSettingsPort,
  type DateFormatSettingsValues,
  type DateFormatUpdate,
} from "@features/flow-settings-general";
import { useDispatch, useSelector } from "~/context/hooks";
import { setDateFormat } from "~/actions/settings";
import { dateFormatSelector } from "~/reducers/settings";

/** The Date format part of the settings port, built from the mobile store. */
export function useDateFormatSettingsAdapter(): DateFormatSettingsPort {
  const dispatch = useDispatch();
  const format = useSelector(dateFormatSelector);

  const values = useMemo<DateFormatSettingsValues>(
    () => ({ dateFormat: isSettingsDateFormat(format) ? format : "default" }),
    [format],
  );
  const setValue = useCallback(
    (update: DateFormatUpdate) => dispatch(setDateFormat(update.value)),
    [dispatch],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}
