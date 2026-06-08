/**
 * InlinedSwitch
 *
 * A fully self-contained version of the Switch component. All internal package
 * imports have been inlined so this file can be shared and dropped into any
 * React Native project. The only external dependencies are `react`,
 * `react-native` and `react-native-reanimated`.
 *
 * Design tokens (sizes, colors, motion) have been resolved to their concrete
 * values from the light theme so no theme provider is required.
 */
import type { ComponentPropsWithRef, Dispatch, FC, Ref, ReactNode, SetStateAction } from "react";
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GestureResponderEvent,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewProps,
  ViewStyle,
  View,
} from "react-native";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type WithTimingConfig,
} from "react-native-reanimated";

/* -------------------------------------------------------------------------- */
/* Resolved design tokens (light theme)                                       */
/* -------------------------------------------------------------------------- */

const COLORS = {
  bgMutedStrong: "#767676", // grey 600
  bgActive: "#d4a0ff", // purple 600
  bgDisabled: "#f1f1f1", // grey 200
  bgBase: "#ffffff", // grey 050
  thumb: "white",
} as const;

const BORDER_RADIUS_FULL = 10000;
const PADDING = 2; // spacings.s2

const MOTION = {
  duration: 200, // durations.200
  easing: [0.4, 0, 0.2, 1] as const, // easings.easeInOut
};

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

type Size = "sm" | "md";

export type SwitchProps = {
  /**
   * The disabled state of the switch.
   * @default false
   */
  disabled?: boolean;
  /**
   * The controlled checked state of the switch.
   * @default false
   */
  checked?: boolean;
  /**
   * The size of the switch.
   * @default 'md'
   */
  size?: Size;
  /**
   * The callback function called when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Sets the initial checked state for uncontrolled Switch.
   * @default false
   */
  defaultChecked?: boolean;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
} & Omit<PressableProps, "children" | "style">;

/* -------------------------------------------------------------------------- */
/* Inlined: shallowEqual                                                      */
/* -------------------------------------------------------------------------- */

function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    key => Object.prototype.hasOwnProperty.call(objB, key) && Object.is(objA[key], objB[key]),
  );
}

/* -------------------------------------------------------------------------- */
/* Inlined: createSafeContext                                                 */
/* -------------------------------------------------------------------------- */

function createSafeContext<ContextValue extends object>(
  rootComponentName: string,
  defaultContext?: ContextValue,
) {
  const Context = createContext<ContextValue | undefined>(defaultContext);

  const Provider: FC<{
    children: ReactNode;
    value: ContextValue;
  }> = ({ children, value }) => {
    const ref = useRef(value);

    if (!shallowEqual(ref.current, value)) {
      ref.current = value;
    }

    return <Context.Provider value={ref.current}>{children}</Context.Provider>;
  };

  Provider.displayName = rootComponentName + "Provider";

  function useSafeContext<ContextRequired extends boolean = boolean>({
    consumerName,
    contextRequired,
  }: {
    consumerName: string;
    contextRequired: ContextRequired;
  }): ContextRequired extends true ? ContextValue : Partial<ContextValue> {
    const context = useContext(Context);

    if (context) {
      return context;
    }
    if (contextRequired) {
      throw new Error(`${consumerName} must be used within ${rootComponentName}`);
    }

    return (defaultContext || {}) as ContextValue;
  }

  return [Provider, useSafeContext] as const;
}

/* -------------------------------------------------------------------------- */
/* Inlined: disabled context                                                  */
/* -------------------------------------------------------------------------- */

type DisabledContextValue = {
  disabled?: boolean;
};

const [, _useDisabledContext] = createSafeContext<DisabledContextValue>("Disabled", {
  disabled: false,
});

const useDisabledContext = ({
  consumerName,
  contextRequired,
  mergeWith,
}: {
  consumerName: string;
  contextRequired?: boolean;
  mergeWith?: DisabledContextValue;
}): boolean => {
  const disabledContext = _useDisabledContext({
    consumerName,
    contextRequired: contextRequired ?? false,
  });

  return Boolean(mergeWith?.disabled || disabledContext.disabled);
};

/* -------------------------------------------------------------------------- */
/* Inlined: useEvent / useControllableState                                   */
/* -------------------------------------------------------------------------- */

function useEvent<T extends (...args: any[]) => any>(callback?: T): T {
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  return useCallback(((...args: any[]) => ref.current?.(...args)) as T, []);
}

type ChangeCb<T> = ((next: T) => void) | Dispatch<SetStateAction<T>>;

/**
 * Allow to use a controlled or uncontrolled state. Defaults to prop-wins.
 */
function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ChangeCb<T>;
}): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(prop ?? defaultProp);
  const previous = useRef<T>(state);
  const propWins = prop !== undefined;
  const value = propWins ? prop : state;
  const onChangeCb = useEvent(onChange);

  useEffect(() => {
    if (prop === undefined) return;
    previous.current = prop;
    setState(prop);
  }, [prop]);

  useEffect(() => {
    if (propWins) return;
    if (state !== previous.current) {
      previous.current = state;
      onChangeCb?.(state);
    }
  }, [onChangeCb, state, propWins]);

  const setter = useEvent((next: SetStateAction<T>) => {
    if (propWins) {
      const nextValue =
        typeof next === "function" ? (next as (prev: T) => T)(previous.current as T) : next;
      onChangeCb?.(nextValue);
    } else {
      setState(next);
    }
  });

  return [value as T, setter];
}

/* -------------------------------------------------------------------------- */
/* Inlined: useTimingConfig                                                   */
/* -------------------------------------------------------------------------- */

const useTimingConfig = (): WithTimingConfig =>
  useMemo(
    () => ({
      duration: MOTION.duration,
      easing: Easing.bezier(...MOTION.easing),
    }),
    [],
  );

/* -------------------------------------------------------------------------- */
/* Inlined: Slot primitives (asChild support)                                 */
/* -------------------------------------------------------------------------- */

type AnyProps = Record<string, any>;

type SlottableViewProps = ComponentPropsWithRef<typeof View> & {
  asChild?: boolean;
};

type SlottablePressableProps = ComponentPropsWithRef<typeof Pressable> & {
  asChild?: boolean;
  /** Platform: WEB ONLY */
  onKeyDown?: (ev: KeyboardEvent) => void;
  /** Platform: WEB ONLY */
  onKeyUp?: (ev: KeyboardEvent) => void;
};

function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T) =>
    refs.forEach(ref => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T>).current = node;
      }
    });
}

type Style = StyleProp<ViewStyle> | PressableProps["style"];

function combineStyles(slotStyle?: Style, childValue?: Style) {
  if (typeof slotStyle === "function" && typeof childValue === "function") {
    return (s: PressableStateCallbackType) => StyleSheet.flatten([slotStyle(s), childValue(s)]);
  }
  if (typeof slotStyle === "function") {
    return (s: PressableStateCallbackType) =>
      childValue
        ? StyleSheet.flatten([slotStyle(s), childValue as StyleProp<ViewStyle>])
        : slotStyle(s);
  }
  if (typeof childValue === "function") {
    return (s: PressableStateCallbackType) =>
      slotStyle
        ? StyleSheet.flatten([slotStyle as StyleProp<ViewStyle>, childValue(s)])
        : childValue(s);
  }
  return StyleSheet.flatten([slotStyle, childValue].filter(Boolean) as StyleProp<ViewStyle>[]);
}

function isTextChildren(
  children: ReactNode | ((state: PressableStateCallbackType) => ReactNode),
): boolean {
  return Array.isArray(children)
    ? children.every(child => typeof child === "string")
    : typeof children === "string";
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps) {
  const overrideProps = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];

    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: unknown[]) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = combineStyles(slotPropValue, childPropValue);
    }
  }

  return { ...slotProps, ...overrideProps };
}

const SlotPressable = ({
  ref,
  ...props
}: PressableProps & ComponentPropsWithRef<typeof Pressable>) => {
  const { children, ...pressableSlotProps } = props;

  if (!isValidElement(children)) {
    console.error("Slot.Pressable - Invalid asChild element", children);
    return null;
  }

  return cloneElement(isTextChildren(children) ? <></> : children, {
    ...mergeProps(pressableSlotProps, (children as any).props as AnyProps),
    ref: ref ? composeRefs(ref, (children as any).ref) : (children as any).ref,
  } as AnyProps);
};

const SlotView = ({ ref, ...props }: ViewProps & ComponentPropsWithRef<typeof View>) => {
  const { children, ...viewSlotProps } = props;

  if (!isValidElement(children)) {
    console.error("Slot.View - Invalid asChild element", children);
    return null;
  }

  return cloneElement(isTextChildren(children) ? <></> : children, {
    ...mergeProps(viewSlotProps, (children as any).props as AnyProps),
    ref: ref ? composeRefs(ref, (children as any).ref) : (children as any).ref,
  } as AnyProps);
};

/* -------------------------------------------------------------------------- */
/* Inlined: styles                                                            */
/* -------------------------------------------------------------------------- */

const SIZES: Record<Size, { width: number; height: number }> = {
  sm: { width: 24, height: 16 },
  md: { width: 40, height: 24 },
};

const THUMB_SIZES: Record<Size, number> = {
  sm: 12,
  md: 20,
};

const THUMB_TRANSLATIONS: Record<Size, number> = {
  sm: 8,
  md: 16,
};

const useStyles = ({
  checked,
  disabled,
  size,
}: {
  checked: boolean;
  disabled: boolean;
  size: Size;
}) =>
  useMemo(() => {
    return {
      root: StyleSheet.flatten([
        {
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          borderRadius: BORDER_RADIUS_FULL,
          padding: PADDING,
          overflow: "hidden",
          ...SIZES[size],
          minWidth: SIZES[size].width,
          maxWidth: SIZES[size].width,
          minHeight: SIZES[size].height,
          maxHeight: SIZES[size].height,
        },
        !checked && !disabled && { backgroundColor: COLORS.bgMutedStrong },
        checked && !disabled && { backgroundColor: COLORS.bgActive },
        disabled && { backgroundColor: COLORS.bgDisabled },
      ]) as ViewStyle,
      thumbBase: StyleSheet.flatten([
        {
          borderRadius: BORDER_RADIUS_FULL,
          backgroundColor: COLORS.thumb,
          width: THUMB_SIZES[size],
          height: THUMB_SIZES[size],
        },
        disabled && { backgroundColor: COLORS.bgBase },
      ]) as ViewStyle,
      thumb: StyleSheet.flatten([
        {
          borderRadius: BORDER_RADIUS_FULL,
          backgroundColor: COLORS.thumb,
          width: THUMB_SIZES[size],
          height: THUMB_SIZES[size],
          transform: [{ translateX: checked ? THUMB_TRANSLATIONS[size] : 0 }],
        },
        disabled && { backgroundColor: COLORS.bgBase },
      ]) as ViewStyle,
    };
  }, [checked, disabled, size]);

/* -------------------------------------------------------------------------- */
/* BaseSwitch                                                                 */
/* -------------------------------------------------------------------------- */

const ROOT_COMPONENT_NAME = "BaseSwitch";
const THUMB_COMPONENT_NAME = "BaseSwitchThumb";

type BaseSwitchRootProps = SlottablePressableProps & {
  checked: SwitchProps["checked"];
  onCheckedChange: SwitchProps["onCheckedChange"];
  disabled?: SwitchProps["disabled"];
  size?: SwitchProps["size"];
  onKeyDown?: (ev: React.KeyboardEvent) => void;
};

const [BaseSwitchProvider, useBaseSwitchContext] =
  createSafeContext<BaseSwitchRootProps>(ROOT_COMPONENT_NAME);

const BaseSwitchRoot = ({
  asChild,
  checked,
  size = "md",
  onCheckedChange,
  disabled = false,
  onPress: onPressProp,
  "aria-valuetext": ariaValueText,
  ref,
  ...props
}: BaseSwitchRootProps) => {
  const styles = useStyles({
    checked: !!checked,
    disabled: !!disabled,
    size,
  });

  const onPress = useCallback(
    (ev: GestureResponderEvent) => {
      if (disabled) return;
      onCheckedChange?.(!checked);
      onPressProp?.(ev);
    },
    [disabled, checked, onCheckedChange, onPressProp],
  );

  const Component = asChild ? SlotPressable : Pressable;

  return (
    <BaseSwitchProvider
      value={{
        checked,
        onCheckedChange,
        disabled,
        size,
      }}
    >
      <Component
        style={styles.root}
        ref={ref}
        aria-disabled={disabled}
        role="switch"
        aria-checked={checked}
        onPress={onPress}
        accessibilityState={{
          checked,
          disabled,
        }}
        accessibilityValue={ariaValueText ? { text: ariaValueText } : undefined}
        disabled={disabled}
        {...props}
      />
    </BaseSwitchProvider>
  );
};

const THUMB_TRANSLATE: Record<Size, number> = {
  sm: 8,
  md: 16,
};

const useAnimatedThumb = ({ checked, size }: { checked: boolean | undefined; size: Size }) => {
  const timingConfig = useTimingConfig();
  const translateX = useSharedValue(checked ? THUMB_TRANSLATE[size] : 0);

  useEffect(() => {
    translateX.value = withTiming(checked ? THUMB_TRANSLATE[size] : 0, timingConfig);
    return () => cancelAnimation(translateX);
  }, [checked, size, translateX, timingConfig]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: translateX.value }],
    }),
    [translateX],
  );

  return { animatedStyle };
};

const BaseSwitchThumb = ({ asChild, ref, ...props }: SlottableViewProps) => {
  const {
    checked,
    disabled,
    size = "md",
  } = useBaseSwitchContext({
    consumerName: THUMB_COMPONENT_NAME,
    contextRequired: true,
  });

  const styles = useStyles({
    checked: !!checked,
    disabled: !!disabled,
    size,
  });

  const { animatedStyle } = useAnimatedThumb({ checked, size });

  if (asChild) {
    const Component = SlotView;
    return <Component ref={ref} role="presentation" style={styles.thumb} {...props} />;
  }

  return (
    <Animated.View
      ref={ref}
      role="presentation"
      style={[styles.thumbBase, animatedStyle]}
      {...props}
    />
  );
};

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The switch follows the design system tokens and supports checked, unchecked,
 * disabled, and focus states with proper active interactions.
 *
 * @example
 * // Basic controlled switch
 * const [checked, setChecked] = useState(false);
 * <Switch
 *   checked={checked}
 *   onCheckedChange={setChecked}
 * />
 *
 * // Uncontrolled switch with default state
 * <Switch defaultChecked={true} onCheckedChange={handleChange} />
 */
export const InlinedSwitch = ({
  style,
  checked: checkedProp,
  onCheckedChange: onCheckedChangeProp,
  defaultChecked = false,
  disabled: disabledProp,
  size = "md",
  ref,
  ...props
}: SwitchProps) => {
  const disabled = useDisabledContext({
    consumerName: "Switch",
    mergeWith: { disabled: disabledProp },
  });
  const [checked, onCheckedChange] = useControllableState({
    prop: checkedProp,
    onChange: onCheckedChangeProp,
    defaultProp: defaultChecked,
  });

  return (
    <Pressable ref={ref} style={style} {...props}>
      <BaseSwitchRoot
        disabled={disabled}
        checked={checked}
        onCheckedChange={onCheckedChange}
        size={size}
      >
        <BaseSwitchThumb />
      </BaseSwitchRoot>
    </Pressable>
  );
};
