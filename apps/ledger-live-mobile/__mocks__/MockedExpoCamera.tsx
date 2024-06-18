import React from "react";

type Props = {
  children: React.ReactNode;
};

export class MockedExpoCamera extends React.Component<Props> {
  static useCameraPermissions = () => [
    { canAskAgain: false, expires: "never", granted: true, status: "granted" },
    () => {
      return new Promise(resolve => {
        resolve(jest.fn());
      });
    },
    () => {
      return new Promise(resolve => {
        resolve(jest.fn());
      });
    },
  ];
  render() {
    return <>{this.props.children}</>;
  }
}

export const MockedCameraType = {
  back: "back",
  front: "front",
};
