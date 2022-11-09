import { Component } from "react";
import { connect } from "react-redux";
import i18next from "i18next";
import { differenceInCalendarDays } from "date-fns";
import compareDate from "../logic/compareDate";
import { localeSelector } from "../reducers/settings";
import { State } from "../reducers/types";

type Props = {
  day: Date;
  locale: string;
};

class FormatDay extends Component<Props> {
  shouldComponentUpdate({ day: nextDay, locale: nextLocale }: Props) {
    const { day, locale } = this.props;
    const isSameDay = compareDate(day, nextDay);
    const isSameLocale = locale === nextLocale;
    return !isSameDay || !isSameLocale;
  }

  render(): React.ReactNode {
    const { day, locale } = this.props;
    const dayDiff = differenceInCalendarDays(Date.now(), day);
    const suffix =
      dayDiff === 0
        ? ` - ${i18next.t("common.today")}`
        : dayDiff === 1
        ? ` - ${i18next.t("common.yesterday")}`
        : "";
    const formattedDate = new Intl.DateTimeFormat(locale).format(day);
    return `${formattedDate}${suffix}`;
  }
}

const mapStateToProps = (state: State) => ({
  locale: localeSelector(state),
});

export default connect(mapStateToProps, null, null, {
  forwardRef: true,
})(FormatDay);
