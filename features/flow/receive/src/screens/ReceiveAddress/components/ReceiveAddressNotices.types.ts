import type { ReceiveNoticeView, ReceiveServiceWarningView } from "../ReceiveAddressView.types";

export type ReceiveAddressNoticesProps = Readonly<{
  notices: readonly ReceiveNoticeView[];
  serviceWarning?: ReceiveServiceWarningView;
}>;
