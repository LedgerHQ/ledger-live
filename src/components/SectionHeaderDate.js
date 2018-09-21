// @flow
import { PureComponent } from "react";
import format from "date-fns/format";
import differenceInCalendarDays from "date-fns/difference_in_calendar_days";

type Props = {
  day: Date,
};

class SectionHeaderDate extends PureComponent<Props> {
  render(): React$Node {
    const { day } = this.props;
    const dayDiff = differenceInCalendarDays(Date.now(), day);
    const suffix =
      dayDiff === 0 ? " - Today" : dayDiff === 1 ? " - Yesterday" : "";
    return `${format(day, "MMMM DD, YYYY")}${suffix}`;
  }
}

export default SectionHeaderDate;
