// @flow
import { Component } from "react";
import compareDate from "../logic/compareDate";

type Props = {
  date: Date,
};

class OperationRowDate extends Component<Props> {
  shouldComponentUpdate({ date: nextDate }: Props) {
    const { date } = this.props;
    const isSameDate = compareDate(date, nextDate);
    return !isSameDate;
  }

  render() {
    const { date } = this.props;
    return `at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

export default OperationRowDate;
