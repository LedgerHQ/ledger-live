// @flow
import React from "react";
import { format } from "date-fns";

import compareDate from "../logic/compareDate";

type Props = {
  date: ?Date,
  format?: string,
};

function FormatDate({ date, format: formatProp = "MMMM d, yyyy" }: Props) {
  return date && date.getTime() ? format(date, formatProp) : null;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
