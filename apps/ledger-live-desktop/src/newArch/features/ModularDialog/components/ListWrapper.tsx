import React from "react";

type Props = {
  children: React.ReactNode;
  customHeight?: string;
  testID?: string;
};

const TITLE_HEIGHT = 52;
const ROW_MARGIN = 8;
const MARGIN_BOTTOM = TITLE_HEIGHT + ROW_MARGIN;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

export const ListWrapper = ({ children, customHeight, ...rest }: Props) => (
  <div className="w-full overflow-hidden" style={{ height: customHeight ?? LIST_HEIGHT }} {...rest}>
    {children}
  </div>
);
