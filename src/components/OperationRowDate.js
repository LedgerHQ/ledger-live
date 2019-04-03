// @flow
import { Component } from "react";
import compareDate from "../logic/compareDate";
import { withLocale } from "../context/Locale";

type Props = {
  date: Date,
  locale: string,
};

class OperationRowDate extends Component<Props> {
  shouldComponentUpdate({ date: nextDate }: Props) {
    const { date } = this.props;
    const isSameDate = compareDate(date, nextDate);
    return !isSameDate;
  }

  render() {
    const { date, locale } = this.props;
    return `at ${date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

export default withLocale(OperationRowDate);
