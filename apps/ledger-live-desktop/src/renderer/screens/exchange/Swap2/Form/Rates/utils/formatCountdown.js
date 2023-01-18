// @flow

export const formatCountdown = (timeSeconds: number) => {
  const timeS = Math.abs(timeSeconds);
  const minutes = Math.floor(timeS / 60);
  const seconds = timeS % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
