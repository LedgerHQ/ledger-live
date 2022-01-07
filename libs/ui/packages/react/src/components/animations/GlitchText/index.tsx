import React, { useEffect, useState } from "react";

function makeRandomString(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export interface GlitchTextProps {
  text: string;
  duration?: number;
  delay?: number;
}

const INTERVAL = 77;

export default function GlitchText({ text, duration = 800, delay = 500 }: GlitchTextProps) {
  const [shownText, setShownText] = useState(text);

  useEffect(() => {
    let frameT = 0;
    const startFrame = Math.floor((1 + delay) / INTERVAL);
    const totalFrames = Math.floor((delay + duration) / INTERVAL);
    const interval = setInterval(() => {
      if (frameT >= startFrame) {
        if (frameT >= totalFrames) {
          setShownText(text);
          clearInterval(interval);
          frameT = 0;
          return;
        }
        const t1 = text.substr(0, -totalFrames + frameT + text.length);
        const t2 = t1.length > 0 ? text.substr(t1.length, text.length) : text;
        setShownText(t1 + makeRandomString(t2.length));
      }
      frameT++;
    }, INTERVAL);

    return () => {
      interval && clearInterval(interval);
    };
  }, [delay, duration, text]);

  return <>{shownText}</>;
}
