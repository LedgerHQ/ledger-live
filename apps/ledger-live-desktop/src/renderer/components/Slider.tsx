import React, { useState, useRef, useCallback, useEffect } from "react";
import { DefaultTheme, withTheme } from "styled-components";
import IconOpposingChevrons from "~/renderer/icons/OpposingChevrons";
import { lighten } from "~/renderer/styles/helpers";
import { Theme as OldTheme } from "~/renderer/styles/theme";

const getPalette = (theme: DefaultTheme) => ({
  default: {
    primary: theme.colors.palette.primary.main,
    primaryHover: lighten(theme.colors.palette.primary.main, 0.1),
    secondary: theme.colors.palette.divider,
    buttonInner: theme.colors.palette.primary.contrastText,
  },
  error: {
    primary: theme.colors.alertRed,
    primaryHover: lighten(theme.colors.alertRed, 0.1),
    secondary: theme.colors.palette.divider,
    buttonInner: theme.colors.palette.primary.contrastText,
  },
});

type Props = {
  steps: number;
  value: number;
  error: Error | undefined | null;
  onChange: (a: number) => void;
  theme: DefaultTheme;
};

function xForEvent(node: HTMLDivElement | null, e: MouseEvent) {
  if (!node) throw new Error("node expected");
  const { clientX } = e;
  const { left } = node.getBoundingClientRect();
  return clientX - left;
}

const Handle = React.memo(function Handle({
  active,
  x,
  colors,
}: {
  active: boolean;
  x: number;
  colors: OldTheme["colors"];
}) {
  const [hover, setHover] = useState(false);
  const onMouseEnter = useCallback(() => setHover(true), []);
  const onMouseLeave = useCallback(() => setHover(false), []);
  const size = 14;
  const style: React.CSSProperties = {
    boxSizing: "border-box",
    cursor: active ? "ew-resize" : "pointer",
    WebkitTapHighlightColor: "rgba(0,0,0,0)",
    boxShadow: "0 6px 8px 0 rgba(0, 0, 0, 0.09)",
    left: `${(100 * x).toPrecision(3)}%`,
    width: 2 * size,
    height: 2 * size,
    borderRadius: 2 * size,
    position: "absolute",
    backgroundColor: hover || active ? colors.primaryHover : colors.primary,
    border: "2px solid",
    borderColor: colors.buttonInner,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "100ms transform",
    transform: `translate(-${size + 2}px,-${size + 2}px) scale(${active ? 1.1 : 1})`,
  };
  return (
    <div style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <IconOpposingChevrons size={12} color={colors.buttonInner} />
    </div>
  );
});
const Track = React.memo(function Track({ x, colors }: { x: number; colors: OldTheme["colors"] }) {
  return (
    <div
      style={{
        width: `${(100 * x).toPrecision(3)}%`,
        height: 6,
        borderRadius: 6,
        backgroundColor: colors.primary,
      }}
    />
  );
});
const Slider = ({ steps, value, onChange, error, theme }: Props) => {
  const [down, setDown] = useState<{
    touchId: number;
    x: number;
  } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const internalPadding = 12;
  const reverseX = useCallback(
    (x: number) => {
      if (!root.current) return 0;
      const { width } = root.current.getBoundingClientRect();
      return Math.max(
        0,
        Math.min(
          Math.round(((x - internalPadding) / (width - internalPadding * 2)) * (steps - 1)),
          steps - 1,
        ),
      );
    },
    [steps, root],
  );
  const concernedEvent = useCallback(
    (e: unknown) => {
      if (!(e as TouchEvent).targetTouches) {
        return e;
      }
      if (!down) return (e as TouchEvent).targetTouches[0];
      const touchId = down.touchId;
      const items = (e as TouchEvent).changedTouches;
      for (let i = 0; i < items.length; ++i) {
        if (items[i].identifier === touchId) return items[i];
      }
      return null;
    },
    [down],
  );
  const onHandleStart = useCallback(
    (e: MouseEvent) => {
      const event = concernedEvent(e);
      if (!event) return;
      e.preventDefault();
      const x = xForEvent(root.current, event as MouseEvent);
      setDown({
        touchId: (event as { identifier: number }).identifier,
        x,
      });
      const valuePos = reverseX(x);
      if (value !== valuePos) onChange(valuePos);
    },
    [root, concernedEvent, reverseX, onChange, value],
  );
  const onHandleMove = useCallback(
    (e: MouseEvent) => {
      const event = concernedEvent(e);
      if (!event) return;
      e.preventDefault();
      const x = xForEvent(root.current, event as MouseEvent);
      const valuePos = reverseX(x);
      if (value !== valuePos) onChange(valuePos);
    },
    [root, concernedEvent, reverseX, value, onChange],
  );
  const onHandleEnd = useCallback(
    (e: MouseEvent) => {
      const event = concernedEvent(e);
      if (!event) return;
      setDown(null);
    },
    [concernedEvent],
  );
  const onHandleAbort = onHandleEnd;
  useEffect(
    // eslint-disable-next-line consistent-return
    () => {
      const { body } = document;
      if (down && body) {
        window.addEventListener("mousemove", onHandleMove);
        window.addEventListener("mouseup", onHandleEnd);

        body.addEventListener("mouseleave", onHandleAbort);
        return () => {
          window.removeEventListener("mousemove", onHandleMove);
          window.removeEventListener("mouseup", onHandleEnd);

          body.removeEventListener("mouseleave", onHandleAbort);
        };
      }
    },
    [down, onHandleAbort, onHandleEnd, onHandleMove],
  );
  const events = {
    onTouchStart: onHandleStart,
    onTouchEnd: onHandleEnd,
    onTouchMove: onHandleMove,
    onTouchCancel: onHandleAbort,
    onMouseDown: onHandleStart,
  };
  const x = value / (steps - 1);
  const palette = getPalette(theme);
  const colors = palette[error ? "error" : "default"];
  return (
    // @ts-expect-error weird events stuff
    <div
      ref={root}
      {...events}
      style={{
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "10px 0",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 6,
          borderRadius: 6,
          backgroundColor: colors.secondary,
          position: "relative",
        }}
      >
        <Track colors={colors} x={x} />
        <div
          style={{
            width: "100%",
            padding: `0 ${internalPadding}px`,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <Handle colors={colors} active={!!down} x={x} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default withTheme(Slider);
