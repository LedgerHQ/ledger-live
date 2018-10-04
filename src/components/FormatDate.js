// @flow
import { Component } from "react";
import format from "date-fns/format";

import compareDate from "../logic/compareDate";

type Props = {
  date: Date,
  format: string,
};

export default class FormatDate extends Component<Props> {
  shouldComponentUpdate({ date: nextDate }: Props) {
    const { date } = this.props;
    const isSameDate = compareDate(date, nextDate);
    return !isSameDate;
  }

  render() {
    const { date, format: propFormat } = this.props;
    return format(date, propFormat);
  }
}
