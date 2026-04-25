import React from "react";
import RecoverWidgetView from "./RecoverWidgetView";
import { useRecoverWidgetViewModel } from "./useRecoverWidgetViewModel";

const RecoverWidget = () => <RecoverWidgetView {...useRecoverWidgetViewModel()} />;

export default RecoverWidget;
