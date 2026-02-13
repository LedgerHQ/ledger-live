import { useState, useCallback, useEffect, type RefObject } from "react";

/**
 * @param {RefObject<HTMLElement>} myRef - reference to the element
 * @returns {Object} - width and height of the element
 */

export const useResize = (
  myRef: RefObject<HTMLElement | null>,
): { width: number; height: number } => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const handleResize = useCallback(() => {
    if (!myRef.current) return;
    setWidth(myRef.current.offsetWidth);
    setHeight(myRef.current.offsetHeight);
  }, [myRef]);

  useEffect(() => {
    if (width === 0 && height === 0 && myRef.current) {
      setWidth(myRef.current.offsetWidth);
      setHeight(myRef.current.offsetHeight);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [myRef, handleResize, width, height]);

  return { width, height };
};
