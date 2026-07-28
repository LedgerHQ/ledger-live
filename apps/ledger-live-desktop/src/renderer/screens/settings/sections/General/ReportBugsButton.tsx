import React, { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setSentryLogs } from "~/renderer/actions/settings";
import { sentryLogsSelector } from "~/renderer/reducers/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
const ReportBugsButton = () => {
  const dispatch = useDispatch();
  const reportBugs = useSelector(sentryLogsSelector);
  const onChangeReportBugs = useCallback(
    (value: boolean) => {
      dispatch(setSentryLogs(value));
    },
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event={reportBugs ? "ReportBugsEnabled" : "ReportBugsDisabled"} />
      <Switch isChecked={reportBugs} onChange={onChangeReportBugs} data-e2e="reportBugs_button" />
    </>
  );
};
export default ReportBugsButton;
