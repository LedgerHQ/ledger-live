const React = require("react");
const passthroughNative = require("@support/jest-shared/mocks/passthrough-native");

// The shared native stub renders Banner's `description` as visible Text but not its `title`
// (flow packages don't set one). InfoState always sets both, and its tests assert the title.
// Everything except Banner is delegated to @support/jest-shared so this stays in lockstep
// with the shared stub instead of forking it.
function Banner({ children, title, description, primaryAction, secondaryAction, ...props }) {
  return React.createElement(
    "Banner",
    { ...props, title, description, primaryAction, secondaryAction },
    title === undefined ? null : React.createElement("Text", undefined, title),
    description === undefined ? null : React.createElement("Text", undefined, description),
    children,
    primaryAction,
    secondaryAction,
  );
}

module.exports = new Proxy(passthroughNative, {
  get(target, prop) {
    return prop === "Banner" ? Banner : target[prop];
  },
});
