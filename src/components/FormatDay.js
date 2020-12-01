// @flow
import { Component } from "react";
import i18next from "i18next";
import { format, differenceInCalendarDays } from "date-fns";
import compareDate from "../logic/compareDate";

type Props = {
  day: Date,
};

class FormatDay extends Component<Props> {
  shouldComponentUpdate({ day: nextDay }: Props) {
    const { day } = this.props;
    const isSameDay = compareDate(day, nextDay);
    return !isSameDay;
  }

  render(): React$Node {
    const { day } = this.props;
    const dayDiff = differenceInCalendarDays(Date.now(), day);
    const suffix =
      dayDiff === 0
        ? ` - ${i18next.t("common.today")}`
        : dayDiff === 1
        ? ` - ${i18next.t("common.yesterday")}`
        : "";
    return `${format(day, "MMMM dd, yyyy")}${suffix}`;
  }
}

export default FormatDay;
