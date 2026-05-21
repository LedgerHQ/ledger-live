export const getByTestId = (testId: string): ReturnType<WebdriverIO.Browser["$"]> => {
  const selector = driver.isAndroid
    ? `android=new UiSelector().resourceId("${testId}")`
    : `~${testId}`;
  return $(selector);
};

export const getByTestIdMatching = (partialId: RegExp): ReturnType<WebdriverIO.Browser["$"]> => {
  const selector = driver.isAndroid
    ? `android=new UiSelector().resourceIdMatches("${partialId.source}")`
    : `-ios predicate string:name MATCHES "${partialId.source}"`;
  return $(selector);
};
