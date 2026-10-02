import { useEffect } from "react";

const EDITABLE = 'input, textarea, [contenteditable]:not([contenteditable="false"])';

// Fires on keyup, like the react-key-handler default this replaces
export function useCtrlShortcut(key: string, onTrigger: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.matches(EDITABLE)) return;
      if (event.ctrlKey && event.key === key) onTrigger();
    };
    document.addEventListener("keyup", onKeyUp);
    return () => document.removeEventListener("keyup", onKeyUp);
  }, [key, onTrigger, enabled]);
}
