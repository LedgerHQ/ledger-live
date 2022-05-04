// @flow

import React, { useRef } from "react";

import {
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Animated, Platform } from "react-native";

const PanAndZoomView = ({ children }: { children: React$Node }) => {
  // normal number used to store the current scale and update the corresponding animated value
  // after the pinch gesture is finished
  const scaleOffset = useRef(1);
  // animated value used to store the current scale after the pinch gesture is finished
  const animatedScaleOffset = useRef(new Animated.Value(1)).current;
  // animated value to store the scale during the pinch gesture (which always starts at 1)
  const pinchScale = useRef(new Animated.Value(1)).current;
  // binding of the pinchScale value to the pinch gesture scale
  const handlePinch = Animated.event([{ nativeEvent: { scale: pinchScale } }], {
    useNativeDriver: true,
  });
  // actual scale of the image at any given moment (during the pinch gesture and after)
  const scale = Animated.multiply(pinchScale, animatedScaleOffset);

  // normal number used to store the current translate X and update the corresponding animated value
  // after the pan gesture is finished
  const translateXOffset = useRef(0);
  // animated value used to store the current translate X after the pan gesture is finished
  const animatedTranslateXOffset = useRef(new Animated.Value(0)).current;
  // animated value to store the translate X during the pan gesture (which always starts at 0)
  const panTranslateX = useRef(new Animated.Value(0)).current;
  // actual translate X of the image at any given moment (during the pan gesture and after)
  const translateX = Animated.add(
    animatedTranslateXOffset,
    Platform.OS === "ios"
      ? panTranslateX
      : Animated.divide(panTranslateX, scale),
    // on android the scale of the outer view impacts the translation so we need to compensate, not on ios
  );

  // normal number used to store the current translate Y and update the corresponding animated value
  // after the pan gesture is finished
  const translateYOffset = useRef(0);
  // animated value used to store the current translate Y after the pan gesture is finished
  const animatedTranslateYOffset = useRef(new Animated.Value(0)).current;
  // animated value to store the translate Y during the pan gesture (which always starts at 0)
  const panTranslateY = useRef(new Animated.Value(0)).current;
  // actual translate Y of the image at any given moment (during the pan gesture and after)
  const translateY = Animated.add(
    animatedTranslateYOffset,
    Platform.OS === "ios"
      ? panTranslateY
      : Animated.divide(panTranslateY, scale),
    // on android the scale of the outer view impacts the translation so we need to compensate, not on ios
  );

  // binding of the panTranslateX and panTranslateY values to the pan gesture translations
  const handlePan = Animated.event(
    [
      {
        nativeEvent: {
          translationX: panTranslateX,
          translationY: panTranslateY,
        },
      },
    ],
    {
      useNativeDriver: true,
    },
  );

  // we restrict pinch gestures to two fingers and panning gesture to one finger otherwise they
  // conflict with each other and we get weird behaviour on Android
  return (
    // $FlowFixMe
    <PinchGestureHandler
      onGestureEvent={handlePinch}
      minPointers={2}
      maxPointers={2}
      onHandlerStateChange={e => {
        if (e.nativeEvent.state === State.END) {
          // stores the current scale
          scaleOffset.current *= e.nativeEvent.scale;
          animatedScaleOffset.setValue(scaleOffset.current);
          // resets the pinch scale to 1 once the gesture is finished
          pinchScale.setValue(1);
        }
      }}
    >
      {/* each gesture handler can only update 1 view, so we need one for
       scaling and another for panning, this is the scaling view */}
      <Animated.View
        style={[
          {
            transform: [{ scale }],
          },
        ]}
      >
        <PanGestureHandler
          onGestureEvent={handlePan}
          minPointers={1}
          maxPointers={1}
          onHandlerStateChange={e => {
            if (e.nativeEvent.state === State.END) {
              // stores the current translate X
              translateXOffset.current +=
                Platform.OS === "ios"
                  ? e.nativeEvent.translationX
                  : e.nativeEvent.translationX / scaleOffset.current;
              // on android the scale of the outer view impacts the translation so we need to compensate, not on ios
              animatedTranslateXOffset.setValue(translateXOffset.current);
              // resets the pan translate X to 0 once the gesture is finished
              panTranslateX.setValue(0);

              // stores the current translate Y
              translateYOffset.current +=
                Platform.OS === "ios"
                  ? e.nativeEvent.translationY
                  : e.nativeEvent.translationY / scaleOffset.current;
              // on android the scale of the outer view impacts the translation so we need to compensate, not on ios
              animatedTranslateYOffset.setValue(translateYOffset.current);
              // resets the pan translate Y to 0 once the gesture is finished
              panTranslateY.setValue(0);
            }
          }}
        >
          {/* translating view */}
          <Animated.View
            style={[
              {
                transform: [
                  {
                    translateX,
                  },
                  {
                    translateY,
                  },
                ],
              },
            ]}
          >
            {children}
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </PinchGestureHandler>
  );
};

export default PanAndZoomView;
