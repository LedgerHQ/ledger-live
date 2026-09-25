export interface DetoxTestFailedResult {
    type: 'testFailed';
    params: {
        viewHierarchy?: string;
        viewHierarchyURL?: string;
        visibilityFailingScreenshotsURL?: string;
        visibilityFailingRectsURL?: string;
        DetoxFailureInformation?: {
            object?: string;
            lineNumber?: number;
            file?: string;
            functionName?: string;
        };
        details?: string;
        NSLocalizedDescription?: string;
        elementAttributes?: {
            activationPoint?: {
                x: number;
                y: number;
            };
            elementSafeBounds?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            elementFrame?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            label?: string;
            elementBounds?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            frame?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            className?: string;
            normalizedActivationPoint?: {
                x: number;
                y: number;
            };
            enabled?: boolean;
            safeAreaInsets?: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
            layer?: string;
            text?: string;
            hittable?: boolean;
            visible?: boolean;
        };
        viewDescription?: string;
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
