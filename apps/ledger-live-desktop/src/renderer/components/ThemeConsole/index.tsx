import React, { useCallback, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "~/renderer/actions/settings";
import { themeSelector } from "~/renderer/actions/general";
import { useTheme, ThemeMode, IconButton } from "@ledgerhq/ldls-ui-react";
import { Moon, Sun } from "@ledgerhq/ldls-ui-react/symbols";

const STORAGE_KEY = "theme-console-position";

// Padding to keep the console accessible (especially top for window drag area)
const BOUNDS_PADDING = {
  top: 60,
  right: 10,
  bottom: 10,
  left: 10,
};
const CONSOLE_WIDTH = 120;
const CONSOLE_HEIGHT = 50;

const getInitialPosition = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const pos = JSON.parse(saved);
      // Ensure saved position respects bounds
      return {
        x: Math.max(
          BOUNDS_PADDING.left,
          Math.min(pos.x, window.innerWidth - CONSOLE_WIDTH - BOUNDS_PADDING.right),
        ),
        y: Math.max(
          BOUNDS_PADDING.top,
          Math.min(pos.y, window.innerHeight - CONSOLE_HEIGHT - BOUNDS_PADDING.bottom),
        ),
      };
    }
  } catch {
    // Ignore
  }
  return {
    x: window.innerWidth - CONSOLE_WIDTH - BOUNDS_PADDING.right,
    y: window.innerHeight - CONSOLE_HEIGHT - BOUNDS_PADDING.bottom - 60,
  };
};

const ThemeConsole = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(themeSelector);
  const { setMode } = useTheme();
  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minX = BOUNDS_PADDING.left;
      const maxX = window.innerWidth - CONSOLE_WIDTH - BOUNDS_PADDING.right;
      const minY = BOUNDS_PADDING.top;
      const maxY = window.innerHeight - CONSOLE_HEIGHT - BOUNDS_PADDING.bottom;

      const newX = Math.max(minX, Math.min(maxX, e.clientX - dragOffset.current.x));
      const newY = Math.max(minY, Math.min(maxY, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setPosition((pos: { x: number; y: number }) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
        } catch {
          // Ignore
        }
        return pos;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleChangeTheme = (theme: ThemeMode) => {
    dispatch(setTheme(theme));
    setMode(theme);
  };

  return (
    <div
      className="pointer-events-auto fixed z-[9999999999]"
      style={{ left: position.x, top: position.y, opacity: isDragging ? 0.8 : 1 }}
    >
      <div className="flex select-none flex-row gap-8 rounded-[8px] bg-muted-transparent p-8 shadow-xl">
        <div
          className="flex cursor-grab items-center justify-center px-2 text-muted active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          title="Drag to move"
        >
          ⋮⋮
        </div>

        <IconButton
          aria-label={currentTheme === "light" ? "Light theme" : "Dark theme"}
          icon={currentTheme === "light" ? Sun : Moon}
          onClick={() => handleChangeTheme(currentTheme === "light" ? "dark" : "light")}
          size="md"
          appearance="base"
          tooltip
        />
      </div>
    </div>
  );
};

export default ThemeConsole;
