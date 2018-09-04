// @flow

import { PureComponent } from "react";
import moment from "moment";

type Props = {
  date: Date,
  format: string,
};

export default class FormatDate extends PureComponent<Props> {
  render() {
    const { date, format } = this.props;
    return moment(date).format(format);
  }
}
