export interface DetoxTestFailedResult {
  type: 'testFailed';
  params: {
    /**
     * Raw XML string of the view hierarchy.
     */
    viewHierarchy?: string;
    /**
     * Path to a directory containing the native view hierarchy.
     */
    viewHierarchyURL?: string;
    /**
     * Path to a directory with failure screenshots.
     */
    visibilityFailingScreenshotsURL?: string;
    /**
     * Path to a directory with failure rectangle screenshots.
     */
    visibilityFailingRectsURL?: string;
    /**
     * Stack trace information.
     */
    DetoxFailureInformation?: {
      object?: string;
      lineNumber?: number;
      file?: string;
      functionName?: string;
    };
    /**
     * The failure details string.
     */
    details?: string;
    /**
     * Localized error description
     */
    NSLocalizedDescription?: string;
    /**
     * Element attributes for the failed element
     */
    elementAttributes?: {
      activationPoint?: { x: number; y: number };
      elementSafeBounds?: { x: number; y: number; width: number; height: number };
      elementFrame?: { x: number; y: number; width: number; height: number };
      label?: string;
      elementBounds?: { x: number; y: number; width: number; height: number };
      frame?: { x: number; y: number; width: number; height: number };
      className?: string;
      normalizedActivationPoint?: { x: number; y: number };
      enabled?: boolean;
      safeAreaInsets?: { top: number; left: number; bottom: number; right: number };
      layer?: string;
      text?: string;
      hittable?: boolean;
      visible?: boolean;
    };
    /**
     * Technical view description
     */
    viewDescription?: string;
    /**
     * List of windows
     */
    windows?: string[];
  };
}

export interface DetoxInvokeResult {
  type: 'invokeResult';
  params: {
    result?: string;
    screenshotPath?: string;
  };
}
