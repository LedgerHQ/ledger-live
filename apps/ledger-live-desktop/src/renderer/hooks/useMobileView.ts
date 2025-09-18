import { useState } from "react";

export interface WebViewWrapperProps {
  mobileView: MobileView;
}

export interface MobileView {
  display: boolean;
  width: number;
}

const initialMobileView: MobileView = {
  display: false,
  width: 355,
};

export const useMobileView = () => {
  const [mobileView, setMobileView] = useState<MobileView>(initialMobileView);

  return {
    mobileView,
    setMobileView,
  };
};
