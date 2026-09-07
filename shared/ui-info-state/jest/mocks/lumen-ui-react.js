const React = require("react");
const passthroughWeb = require("@support/jest-shared/mocks/passthrough-web");

// The shared web stub has no Banner case, so `title` and `description` are forwarded as DOM
// attributes rather than rendered as text, and InfoState's tests assert both are visible.
// Everything except Banner is delegated to @support/jest-shared so this stays in lockstep
// with the shared stub instead of forking it.
function Banner({ title, description, ...props }) {
  return React.createElement(
    "div",
    props,
    title === undefined ? null : React.createElement("h4", undefined, title),
    description === undefined ? null : React.createElement("p", undefined, description),
  );
}

module.exports = new Proxy(passthroughWeb, {
  get(target, prop) {
    return prop === "Banner" ? Banner : target[prop];
  },
});
