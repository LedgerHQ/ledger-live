import React from "react";
import RecoverWidgetView from "./RecoverWidgetView";
import { useRecoverWidgetViewModel } from "./useRecoverWidgetViewModel";

const RecoverWidget = () => {
  const { isVisible, titleKey, descriptionKey, onOpenRecover } = useRecoverWidgetViewModel();
  return (
    <RecoverWidgetView
      isVisible={isVisible}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      onOpenRecover={onOpenRecover}
    />
  );
};

export default RecoverWidget;
