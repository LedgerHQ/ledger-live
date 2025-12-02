"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var FUN_exports = {};
__export(FUN_exports, {
  default: () => FUN_default
});
module.exports = __toCommonJS(FUN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ed1968";
function FUN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.594 20.11a7.3 7.3 0 01-2.625-1.35 8.7 8.7 0 01-1.95-2.1 8.4 8.4 0 01-1.2-2.775 8.3 8.3 0 010-3.6 9.8 9.8 0 011.125-2.85 7.74 7.74 0 013.15-2.85 8 8 0 011.425-.6c.75.9 1.5 1.875 2.25 2.85.075.15.225.225.3.375a5.8 5.8 0 00-2.175.525A5.1 5.1 0 008.319 9.01a6.3 6.3 0 00-.975 1.875c-.2.816-.174 1.672.075 2.475l3.225-2.55c.75.975 1.5 1.875 2.25 2.85-1.05.825-2.175 1.65-3.225 2.55 1.05 1.35 2.175 2.775 3.225 4.2a8 8 0 01-3.3-.3m7.147-9.086a5 5 0 00-.097-.364c-.101.08-2.332 1.785-3.225 2.55-.75-.975-1.5-1.875-2.25-2.85 1.05-.825 2.175-1.65 3.225-2.55-1.05-1.35-2.1-2.7-3.225-4.125 0-.075-.075-.075-.075-.15h1.05a8.25 8.25 0 015.25 1.95 8.1 8.1 0 011.8 2.1c.56.859.919 1.833 1.05 2.85a9.3 9.3 0 01-.075 3.525 7.4 7.4 0 01-1.2 2.7 8 8 0 01-1.875 2.025 6.6 6.6 0 01-2.475 1.35 52 52 0 01-1.875-2.4 5.7 5.7 0 01-.6-.825 4.62 4.62 0 003.675-1.8 4.85 4.85 0 00.9-1.875q.21-.855.022-2.11m-3.542 6.28q.777 1.061 1.613 2.078a6.1 6.1 0 001.94-1.144 7.5 7.5 0 001.759-1.905 6.8 6.8 0 001.108-2.492 8.8 8.8 0 00.068-3.334 6.3 6.3 0 00-.976-2.634 7.6 7.6 0 00-1.68-1.958 7.7 7.7 0 00-4.82-1.817c.695.885 1.4 1.787 2.627 3.367l.33.423-.408.349a42 42 0 01-1.633 1.32c-.053.042-.69.531-1.169.902.197.251.426.537.775.975.345.431.574.718.771.97.348-.288.728-.59 1.183-.942.073-.057 1.272-.98 1.61-1.245l.642-.504.242.78c.28.898.31 1.856.085 2.77a5.4 5.4 0 01-1.001 2.09 5.18 5.18 0 01-3.093 1.92z" }));
}
FUN.DefaultColor = DefaultColor;
var FUN_default = FUN;
//# sourceMappingURL=FUN.js.map
