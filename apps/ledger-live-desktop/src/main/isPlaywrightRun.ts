export const isPlaywrightRun = (): boolean => {
  const value = process.env.PLAYWRIGHT_RUN;
  return !!value && value !== "0" && value !== "false";
};
