// @flow
import { PureComponent } from "react";
import format from "date-fns/format";

type Props = {
  date: Date,
  format?: string,
};

export default class FormatDate extends PureComponent<Props> {
  render() {
    const { date, format: propFormat } = this.props;
    return format(date, propFormat);
  }
}
