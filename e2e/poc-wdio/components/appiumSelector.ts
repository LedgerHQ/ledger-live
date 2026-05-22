export const getByTestId = (testId: string): ReturnType<WebdriverIO.Browser["$"]> => {
  const selector = driver.isAndroid
    ? `android=new UiSelector().resourceId("${testId}")`
    : `~${testId}`;
  return $(selector);
};

export const getByTestIdMatching = (regex: RegExp): ReturnType<WebdriverIO.Browser["$"]> => {
  const selector = driver.isAndroid
    ? `android=new UiSelector().resourceIdMatches("${regex.source}")`
    : `-ios predicate string:name MATCHES "${regex.source}"`;
  return $(selector);
};
