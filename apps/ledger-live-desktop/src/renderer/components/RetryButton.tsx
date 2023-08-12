import React, { PureComponent } from "react";
import Button from "~/renderer/components/Button";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
type Props = {
  t: TFunction;
} & React.ComponentProps<typeof Button>;
class RetryButton extends PureComponent<Props> {
  render() {
    const { t, ...props } = this.props;
    return <Button {...props}>{t("common.retry")}</Button>;
  }
}
export default withTranslation()(RetryButton);
