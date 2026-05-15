import React from "react";
import RecoverWidgetView from "./RecoverWidgetView";
import { useRecoverWidgetViewModel } from "./useRecoverWidgetViewModel";

const RecoverWidget = () => {
  const { shouldDisplay, titleKey, descriptionKey, onOpenRecover } = useRecoverWidgetViewModel();
  return (
    <RecoverWidgetView
      shouldDisplay={shouldDisplay}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      onOpenRecover={onOpenRecover}
    />
  );
};

export default RecoverWidget;
