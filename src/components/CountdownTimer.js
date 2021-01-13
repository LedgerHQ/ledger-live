// @flow
import React, { useState } from "react";
import useInterval from "./useInterval";
import LText from "./LText";

const CountdownTimer = ({
  end,
  callback,
}: {
  end: Date,
  callback: Function,
}) => {
  // FIXME only hacked this to work for the 59 seconds of changelly
  const [timeLeft, setTimeLeft] = useState(
    Math.min(59, Math.max(Math.round((end - new Date()) / 1000), 0)),
  );
  const [finished, setFinished] = useState(timeLeft <= 0);
  useInterval(() => {
    if (!end || finished) {
      return;
    }

    const seconds = Math.round((end - new Date()) / 1000);
    if (seconds < 0 && callback) {
      setFinished(true);
      callback();
    } else {
      setTimeLeft(Math.min(59, Math.max(seconds, 0)));
    }
  }, 1000);

  const formattedTime = `00:${timeLeft.toString().padStart(2, "0")}`;
  return (
    <LText semiBold style={{ fontSize: 12 }}>
      {formattedTime}
    </LText>
  );
};

export default CountdownTimer;
