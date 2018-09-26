// @flow
import { Component } from "react";
import compareDate from "../logic/compareDate";

type Props = {
  date: Date,
  text: string,
};

class OperationRowDate extends Component<Props> {
  shouldComponentUpdate({ date: nextDate, text: nextText }: Props) {
    const { date, text } = this.props;
    const isSameDate = compareDate(date, nextDate);
    return !isSameDate || text !== nextText;
  }

  render() {
    const { text, date } = this.props;
    return `${text} at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

export default OperationRowDate;
