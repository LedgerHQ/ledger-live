declare module "react-native-vision-camera" {
  import React from "react";
  import { ViewStyle } from "react-native";

  export type CameraPermissionStatus = "granted" | "not-determined" | "denied" | "restricted";

  export interface Code {
    type: string;
    value: string;
    frame: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  export interface CameraDevice {
    id: string;
    name: string;
    position: "front" | "back" | "external";
    hasFlash: boolean;
    hasTorch: boolean;
    minFocusDistance: number;
    isMultiCam: boolean;
    supportsParallelVideoProcessing: boolean;
    formats: any[];
  }

  export interface CodeScanner {
    codeTypes: string[];
    onCodeScanned: (codes: Code[]) => void;
  }

  export interface CameraProps {
    device: CameraDevice;
    isActive: boolean;
    style?: ViewStyle;
    codeScanner?: CodeScanner;
  }

  export const Camera: React.FC<CameraProps> & {
    getCameraPermissionStatus(): Promise<CameraPermissionStatus>;
    requestCameraPermission(): Promise<CameraPermissionStatus>;
  };

  export function useCameraDevice(position: "front" | "back"): CameraDevice | undefined;

  export function useCodeScanner(config: {
    codeTypes: string[];
    onCodeScanned: (codes: Code[]) => void;
  }): CodeScanner;

  export function useCameraPermission(): {
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
  };
}
