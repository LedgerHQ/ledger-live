import React, { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setCrashReporting } from "~/renderer/actions/settings";
import { crashReportingSelector } from "~/renderer/reducers/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
const ReportBugsButton = () => {
  const dispatch = useDispatch();
  const reportBugs = useSelector(crashReportingSelector);
  const onChangeReportBugs = useCallback(
    (value: boolean) => {
      dispatch(setCrashReporting(value));
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
