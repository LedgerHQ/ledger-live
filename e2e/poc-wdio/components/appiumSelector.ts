export const getByTestId = (testId: string): ReturnType<WebdriverIO.Browser["$"]> => {
  const selector = driver.isAndroid
    ? `android=new UiSelector().resourceId("${testId}")`
    : `~${testId}`;
  return $(selector);
};
