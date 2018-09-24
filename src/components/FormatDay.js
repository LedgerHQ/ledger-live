// @flow
import { Component } from "react";
import format from "date-fns/format";
import differenceInCalendarDays from "date-fns/difference_in_calendar_days";
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
      dayDiff === 0 ? " - Today" : dayDiff === 1 ? " - Yesterday" : "";
    return `${format(day, "MMMM DD, YYYY")}${suffix}`;
  }
}

export default FormatDay;
