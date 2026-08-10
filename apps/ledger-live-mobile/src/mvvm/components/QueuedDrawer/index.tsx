import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Modal, Pressable, StyleProp, useWindowDimensions, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  measure,
  setNativeProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type MeasuredDimensions,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useTheme } from "styled-components/native";
import { Flex, Text, BoxedIcon, Icons } from "@ledgerhq/native-ui";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import useQueuedDrawerNative from "./useQueuedDrawerNative";
import Header from "./Header";
import { logDrawer } from "./utils/logDrawer";

export type Props = {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  Icon?: React.ComponentType | React.ReactNode;
  iconColor?: string;
  subtitle?: string;
  noCloseButton?: boolean;
  hasBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
  preventKeyboardDismissOnClose?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  CustomHeader?: React.ComponentType<{ children?: React.ReactNode }>;
  onBackdropPress?: () => void;
  onBackButtonPress?: () => void;
  onSwipeComplete?: () => void;
  propagateSwipe?: boolean;
};

const ANIMATION_DURATION = 250;

// LIVE-DEBUG(drawer-stuck) round 3: delay of the repair write after onShow. Long
// enough that the 250ms open animation has finished and any surface mount has
// settled, so the write is unambiguously "after everything".
const REPAIR_WRITE_DELAY = 500;

// LIVE-DEBUG(drawer-stuck) round 4: second repair, via setNativeProps rather than
// a shared value, far enough after the first that the two are unambiguous in the
// log.
const REPAIR2_WRITE_DELAY = 400;

const QueuedDrawerNative = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onModalHide,
  noCloseButton,
  hasBackButton,
  preventBackdropClick,
  preventKeyboardDismissOnClose,
  style,
  containerStyle,
  children,
  title,
  description,
  Icon,
  iconColor,
  subtitle,
  CustomHeader,
  onBackdropPress: _onBackdropPress,
  onBackButtonPress: _onBackButtonPress,
  onSwipeComplete: _onSwipeComplete,
  propagateSwipe: _propagateSwipe,
}: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    instanceId,
    areDrawersLocked,
    isVisible,
    handleDismiss,
    onBack: hookOnBack,
    enablePanDownToClose,
  } = useQueuedDrawerNative({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onModalHide,
    preventBackdropClick,
    preventKeyboardDismissOnClose,
  });

  const translateY = useSharedValue(1000);
  const backdropOpacity = useSharedValue(0);
  const closeAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // LIVE-DEBUG(drawer-stuck) round 3: pending repair write. Must be cancelled by
  // any close and on unmount — otherwise a drawer that closed inside the delay
  // window would be yanked back to translateY 0 and reappear.
  const repairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repair2TimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRepair = useCallback(() => {
    if (repairTimeoutRef.current) {
      clearTimeout(repairTimeoutRef.current);
      repairTimeoutRef.current = null;
    }
    if (repair2TimeoutRef.current) {
      clearTimeout(repair2TimeoutRef.current);
      repair2TimeoutRef.current = null;
    }
  }, []);
  useEffect(() => clearRepair, [clearRepair]);

  // LIVE-DEBUG(drawer-stuck) round 4. Rounds 1-3 only ever logged the SHARED
  // VALUE, and a healthy open logs byte-identically to a broken one (both report
  // translateY 0 everywhere). So the shared value cannot discriminate — we need
  // the RENDERED geometry. measure() runs on the UI thread against the real
  // native view, which is the ground truth the hierarchy dump gave us
  // post-mortem, now available live and comparable against the repair writes.
  const containerRef = useAnimatedRef<View>();
  const { height: screenHeight } = useWindowDimensions();

  const logMeasure = useCallback(
    (label: string, m: MeasuredDimensions | null) => {
      if (!m) {
        logDrawer(`measure ${label}: NULL (view not measurable)`, { instanceId });
        return;
      }
      // Sheet is bottom-anchored, so a correctly presented drawer measures at
      // screenHeight - height. Anything materially below that is the bug, and
      // the delta should come out at ~1000 (the initial translateY, in dp).
      const expectedY = screenHeight - m.height;
      const delta = Math.round(m.pageY - expectedY);
      logDrawer(`measure ${label}`, {
        instanceId,
        pageY: Math.round(m.pageY),
        height: Math.round(m.height),
        expectedY: Math.round(expectedY),
        deltaFromResting: delta,
      });
      if (delta > 100) {
        logDrawer("DRAWER STUCK DETECTED", {
          instanceId,
          label,
          deltaFromResting: delta,
          sharedTranslateY: translateY.value,
          sharedBackdropOpacity: backdropOpacity.value,
        });
      }
    },
    [instanceId, screenHeight, translateY, backdropOpacity],
  );

  const measureNow = useCallback(
    (label: string) => {
      scheduleOnUI(() => {
        "worklet";
        scheduleOnRN(logMeasure, label, measure(containerRef));
      });
    },
    [containerRef, logMeasure],
  );

  // LIVE-DEBUG(drawer-stuck): plain JS callbacks, invoked from the animation
  // worklets via scheduleOnRN — same pattern as the existing `afterOnce`, so the
  // worklet closure stays serialisable.
  //
  // Round 2. Round 1 proved onShow fires and openAnim reports `finished`, yet the
  // committed transform is still 1000. Read the shared value back at three points
  // after the callback to separate "withTiming never applied the value" from
  // "value applied, then reverted or never committed to the view".
  const logAnimEnd = useCallback(
    (label: string) => {
      logDrawer(label, { instanceId, translateYAtCallback: translateY.value });
      requestAnimationFrame(() => {
        logDrawer(`${label} +1frame`, { instanceId, translateY: translateY.value });
      });
      setTimeout(() => {
        logDrawer(`${label} +400ms`, { instanceId, translateY: translateY.value });
      }, 400);
    },
    [instanceId, translateY],
  );

  // LIVE-DEBUG(drawer-stuck): UI-thread view of the same value. This reaction runs
  // on the UI thread, so it reports endpoints even when the JS thread is busy —
  // though the log hop itself still needs JS, so it goes quiet in a full stall.
  const logSettled = useCallback(
    (value: number) => {
      logDrawer("translateY settled (UI thread)", { instanceId, value });
    },
    [instanceId],
  );

  useAnimatedReaction(
    () => translateY.value,
    (cur, prev) => {
      if (prev === null || cur === prev) return;
      // Only the resting/parked endpoints, to keep this off the per-frame path.
      if (cur === 0 || cur === 1000) {
        scheduleOnRN(logSettled, cur);
      }
    },
  );

  const openAnim = useCallback(() => {
    // translateY BEFORE the open animation is the single most diagnostic number.
    // 1000 = parked (fresh mount or a completed close); anything else means we are
    // interrupting an in-flight animation.
    logDrawer("openAnim START", { instanceId, translateYBefore: translateY.value });
    translateY.value = withTiming(
      0,
      {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      },
      finished => {
        scheduleOnRN(logAnimEnd, finished ? "openAnim END finished" : "openAnim END interrupted");
      },
    );
    backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
  }, [translateY, backdropOpacity, instanceId, logAnimEnd]);

  const closeAnim = useCallback(
    (after?: () => void) => {
      // LIVE-DEBUG(drawer-stuck): a close parks translateY back at 1000. If the
      // Modal is still visible after this and no openAnim follows, the drawer is
      // stuck off-screen — this is the second candidate root cause.
      logDrawer("closeAnim START", { instanceId, translateYBefore: translateY.value });

      // LIVE-DEBUG(drawer-stuck) round 3: a close always wins over a pending repair.
      clearRepair();

      // Cancel any pending callback from a previous closeAnim call
      if (closeAnimTimeoutRef.current) {
        clearTimeout(closeAnimTimeoutRef.current);
        closeAnimTimeoutRef.current = null;
      }

      // Build the once-only callback on the JS thread (not in a worklet)
      // so that refs remain accessible when scheduled back via scheduleOnRN.
      const afterOnce = after
        ? () => {
            if (!closeAnimTimeoutRef.current) {
              logDrawer("closeAnim after() SKIPPED (already consumed)", { instanceId });
              return;
            }
            clearTimeout(closeAnimTimeoutRef.current);
            closeAnimTimeoutRef.current = null;
            logDrawer("closeAnim after() RUN", { instanceId });
            after();
          }
        : undefined;

      // Timeout fallback in case the animation completion callback doesn't fire
      if (afterOnce) {
        closeAnimTimeoutRef.current = setTimeout(afterOnce, ANIMATION_DURATION + 50);
      }

      translateY.value = withTiming(
        1000,
        { duration: ANIMATION_DURATION, easing: Easing.in(Easing.cubic) },
        finished => {
          scheduleOnRN(
            logAnimEnd,
            finished ? "closeAnim END finished" : "closeAnim END interrupted",
          );
          if (afterOnce) {
            scheduleOnRN(afterOnce);
          }
        },
      );
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    },
    [translateY, backdropOpacity, instanceId, logAnimEnd, clearRepair],
  );

  const containerAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
    }),
    [translateY],
  );

  const backdropAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: backdropOpacity.value,
    }),
    [backdropOpacity],
  );

  // LIVE-DEBUG(drawer-stuck): round 1 established this DOES fire — kept as the
  // anchor that every later timestamp is read against.
  //
  // Round 3 adds the REPAIR WRITE. Round 2 proved the shared values are correct
  // (translateY 0 across 24 heartbeats) while the rendered views keep their
  // initial styles (transform +1000dp, backdrop alpha 0.0, ScrollView height 0).
  // Re-assigning the target value outside any animation answers the one binary
  // question left:
  //   - sheet appears  -> only the write during the mount window was lost and
  //     nothing ever rewrote it; re-asserting is a legitimate fix.
  //   - sheet stays parked -> this Dialog's views never bind to Reanimated at
  //     all, and the drawer has to move off useAnimatedStyle entirely.
  const onShow = useCallback(() => {
    logDrawer("Modal onShow fired", { instanceId, translateYBefore: translateY.value });
    openAnim();

    clearRepair();
    measureNow("at onShow");

    repairTimeoutRef.current = setTimeout(() => {
      repairTimeoutRef.current = null;
      logDrawer("repair write BEFORE", {
        instanceId,
        translateY: translateY.value,
        backdropOpacity: backdropOpacity.value,
      });
      measureNow("before repair1");
      // Repair 1: plain shared-value assignment, no withTiming.
      translateY.value = 0;
      backdropOpacity.value = 1;
      logDrawer("repair write AFTER", {
        instanceId,
        translateY: translateY.value,
        backdropOpacity: backdropOpacity.value,
      });
      measureNow("after repair1 (shared value)");

      // Repair 2: a DIFFERENT update mechanism. setNativeProps writes straight to
      // the native view instead of going through useAnimatedStyle, so comparing
      // the two measurements localises the break:
      //   repair1 moves it            -> animated-style commit was merely stale
      //   only repair2 moves it       -> the useAnimatedStyle path specifically is broken
      //   neither moves it            -> this Dialog's views take no updates at all
      repair2TimeoutRef.current = setTimeout(() => {
        repair2TimeoutRef.current = null;
        logDrawer("repair2 setNativeProps", { instanceId });
        scheduleOnUI(() => {
          "worklet";
          setNativeProps(containerRef, { transform: [{ translateY: 0 }] });
        });
        measureNow("after repair2 (setNativeProps)");
      }, REPAIR2_WRITE_DELAY);
    }, REPAIR_WRITE_DELAY);
  }, [openAnim, instanceId, translateY, backdropOpacity, clearRepair, measureNow, containerRef]);

  // LIVE-DEBUG(drawer-stuck): bounded heartbeat while the drawer is visible.
  // In round 1 the app's entire log stream stopped ~71s before the test timed out,
  // so we cannot tell a stalled JS thread from "nothing more to log". This ticks
  // every 500ms for 12s: where it stops is when the thread died, and the value it
  // carries says whether the sheet ever left 1000. Not JS_THREAD_MONITOR — that
  // one renders a floating badge that would occlude elements under test.
  useEffect(() => {
    if (!isVisible) return;
    let tick = 0;
    const id = setInterval(() => {
      tick += 1;
      logDrawer("visible heartbeat", { instanceId, tick, translateY: translateY.value });
      // Round 4: pair every tick with the rendered geometry, so the log shows
      // whether the view ever moves — and whether either repair moved it.
      measureNow(`heartbeat ${tick}`);
      if (tick >= 24) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [isVisible, instanceId, translateY, measureNow]);

  const handleCloseUserEvent = useCallback(() => {
    closeAnim(() => {
      requestAnimationFrame(() => {
        handleDismiss();
      });
    });
  }, [closeAnim, handleDismiss]);

  const onRequestClose = useCallback(() => {
    if (!enablePanDownToClose) return;
    closeAnim(() => {
      requestAnimationFrame(() => {
        handleDismiss();
      });
    });
  }, [enablePanDownToClose, closeAnim, handleDismiss]);

  const onBackdropPress = useCallback(() => {
    if (!enablePanDownToClose) return;

    if (_onBackdropPress) {
      _onBackdropPress();
    }

    closeAnim(() => {
      requestAnimationFrame(() => {
        handleDismiss();
      });
    });
  }, [enablePanDownToClose, closeAnim, handleDismiss, _onBackdropPress]);

  const shouldShowHeader = useMemo(
    () => CustomHeader || title || hasBackButton || (!noCloseButton && !areDrawersLocked),
    [CustomHeader, title, hasBackButton, noCloseButton, areDrawersLocked],
  );

  const shouldShowModalHeader = useMemo(
    () => Icon || subtitle || description,
    [Icon, subtitle, description],
  );

  // Close when opening conditions are no longer met (e.g., action succeeded)
  useEffect(() => {
    if (isVisible && !isRequestingToBeOpened && !isForcingToBeOpened) {
      // LIVE-DEBUG(drawer-stuck): if this fires while the drawer is mid-open, it
      // parks translateY at 1000 and relies on handleDismiss to hide the Modal.
      logDrawer("conditions-no-longer-met -> closeAnim", { instanceId });
      closeAnim(() => {
        requestAnimationFrame(() => {
          handleDismiss();
        });
      });
    }
  }, [
    isVisible,
    isRequestingToBeOpened,
    isForcingToBeOpened,
    closeAnim,
    handleDismiss,
    instanceId,
  ]);

  function renderDrawerIcon() {
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === "function")
      return <BoxedIcon size={64} Icon={Icon} iconSize={24} iconColor={iconColor} />;
    return null;
  }

  return (
    <Flex>
      <Modal
        presentationStyle="overFullScreen"
        animationType="none"
        transparent
        visible={isVisible}
        onShow={onShow}
        onRequestClose={onRequestClose}
        statusBarTranslucent={true}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            testID="drawer-backdrop"
            onPress={onBackdropPress}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.constant.overlay,
            }}
          >
            <Animated.View style={[{ flex: 1 }, backdropAnimatedStyle]} />
          </Pressable>

          <Animated.View
            // LIVE-DEBUG(drawer-stuck) round 4: measured + repaired through this ref.
            ref={containerRef}
            style={[
              containerAnimatedStyle,
              {
                width: "100%",
                maxHeight: "95%",
                backgroundColor: colors.background.drawer,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              },
              containerStyle || undefined,
            ]}
          >
            {shouldShowHeader && CustomHeader ? (
              <CustomHeader>
                {!noCloseButton && !areDrawersLocked ? (
                  <Pressable
                    testID="modal-close-button"
                    onPress={handleCloseUserEvent}
                    hitSlop={16}
                    accessible={true}
                    style={({ pressed }: { pressed: boolean }) => ({
                      position: "absolute",
                      zIndex: 10,
                      top: 16,
                      right: 16,
                      borderRadius: 999,
                      backgroundColor: pressed
                        ? colors.opacityReverse.c50
                        : colors.opacityReverse.c70,
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                    })}
                  >
                    <Icons.Close size="XS" />
                  </Pressable>
                ) : null}
              </CustomHeader>
            ) : null}

            <View
              style={{
                width: "100%",
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: insets.bottom + 16,
              }}
            >
              {shouldShowHeader && !CustomHeader ? (
                <Header
                  title={title}
                  hasBackButton={hasBackButton}
                  hookOnBack={hookOnBack}
                  noCloseButton={noCloseButton}
                  areDrawersLocked={areDrawersLocked}
                  handleCloseUserEvent={handleCloseUserEvent}
                />
              ) : null}

              {shouldShowModalHeader ? (
                <Flex alignItems="center" mb={7}>
                  {renderDrawerIcon()}
                  {subtitle && (
                    <Text variant="subtitle" color="neutral.c80" textAlign="center" mb={2}>
                      {subtitle}
                    </Text>
                  )}
                  {description && (
                    <Text variant="body" color="neutral.c70" textAlign="center" mt={6}>
                      {description}
                    </Text>
                  )}
                </Flex>
              ) : null}

              {children && (
                <View style={style || undefined}>
                  <IsInDrawerProvider>{children}</IsInDrawerProvider>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </Flex>
  );
};

export default React.memo(QueuedDrawerNative);
