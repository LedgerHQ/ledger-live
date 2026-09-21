// expo-web-browser ships ESM source under its react-native export condition and needs a
// native runtime. Suites that pull it in transitively (the DevTools screen, through the Pay
// Card login flow) get a dismissed session instead of opening a browser.
export const openAuthSessionAsync = jest.fn(() => Promise.resolve({ type: "dismiss" }));
