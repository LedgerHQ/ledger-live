import { useState, useCallback, useEffect } from "react";

/**
 * @param {React.MutableRefObject<HTMLElement>} myRef - reference to the element
 * @returns {Object} - width and height of the element
 */

export const useResize = (
  myRef: React.MutableRefObject<HTMLElement | null>,
): { width: number; height: number } => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const handleResize = useCallback(() => {
    if (!myRef.current) return;
    setWidth(myRef.current.offsetWidth);
    setHeight(myRef.current.offsetHeight);
  }, [myRef]);

  useEffect(() => {
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("load", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [myRef, handleResize]);

  return { width, height };
};
