import React, { useState } from "react";
import moment from "moment";
import { Text } from "@ledgerhq/native-ui";
import useInterval from "~/components/useInterval";

export function CountdownTimer({
  end,
  format = "mm:ss",
  callback,
}: {
  end: Date;
  format?: string;
  callback: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(
    moment.utc(end.getTime() - new Date().getTime()).format(format),
  );
  const [finished, setFinished] = useState(false);

  useInterval(() => {
    if (!end || finished) {
      return;
    }

    const seconds = end.getTime() - new Date().getTime();

    if (seconds <= 1 && callback) {
      setFinished(true);
      callback();
    } else {
      setTimeLeft(moment.utc(seconds).format(format));
    }
  }, 1000);

  return (
    <Text fontSize={10} color="neutral.c70">
      {timeLeft}
    </Text>
  );
}
