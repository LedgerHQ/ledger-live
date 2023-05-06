import React, { useMemo } from "react";
import moment from "moment";

type Props = {
  date?: Date;
  format?: string;
};

/**
 * @deprecated prefer useDateTimeFormat hook instead
 */
function FormattedDate({ date, format = "L LT" }: Props) {
  const text = useMemo(() => moment(date).format(format), [date, format]);
  return <>{text}</>;
}

export default FormattedDate;
