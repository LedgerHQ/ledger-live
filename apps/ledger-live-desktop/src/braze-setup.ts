export function getBrazeConfig() {
  if (process.env.BRAZE_API_KEY && process.env.BRAZE_CUSTOM_ENDPOINT) {
    return {
      apiKey: process.env.BRAZE_API_KEY,
      endpoint: process.env.BRAZE_CUSTOM_ENDPOINT,
    };
  } else {
    return {
      apiKey: "d84c8166-a00e-422f-8dc1-e48f103b413c",
      endpoint: "sdk.fra-02.braze.eu",
    };
  }
}
