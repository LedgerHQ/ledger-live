// The flow preset stubs react-native and Lumen. These shims give the OS update views the few
// react-native APIs they reach, and keep `Trans` copy queryable inside Lumen stubs.
import React from "react";

class AnimatedValue {
  constructor(public value: number) {}
  setValue(value: number) {
    this.value = value;
  }
  interpolate() {
    return `${this.value}%`;
  }
}

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
    BackHandler: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
    Easing: { out: (easing: unknown) => easing, quad: (value: number) => value },
    Animated: {
      View: "View",
      Value: AnimatedValue,
      timing: (
        value: AnimatedValue,
        { toValue, duration }: { toValue: number; duration: number },
      ) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        return {
          start: (callback?: (result: { finished: boolean }) => void) => {
            timer = setTimeout(() => {
              value.setValue(toValue);
              callback?.({ finished: true });
            }, duration);
          },
          stop: () => clearTimeout(timer),
        };
      },
    },
  };
});

jest.mock("@shared/i18n", () => {
  const actual = jest.requireActual("@shared/i18n");
  return {
    ...actual,
    Trans: (props: Record<string, unknown>) =>
      React.createElement("Text", undefined, React.createElement(actual.Trans, props)),
  };
});
