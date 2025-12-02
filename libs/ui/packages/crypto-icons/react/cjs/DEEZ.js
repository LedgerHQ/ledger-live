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
var DEEZ_exports = {};
__export(DEEZ_exports, {
  default: () => DEEZ_default
});
module.exports = __toCommonJS(DEEZ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#939393";
function DEEZ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M10.28 14.895a539 539 0 013.906-2.403c1.293-.79 1.293-.79 1.27-.868-.022-.094-8.025-4.956-8.107-5.005q-.228-.135-.451-.277c.147-.102.433-.297.775-.53l.832-.562.571.342c.705.422 8.446 5.169 9.53 5.845a845 845 0 01-4.118 2.435l-4.187 2.468a27 27 0 01-.015-.656 35 35 0 01-.005-.788zm-1.776-4.722c.139.082.379.227.675.411l.771.479.017 1.447c.048 4.183.048 4.183.11 4.225l.04.028.045-.016c.022-.007.03-.01 8.153-4.802l.435-.256-.143 2.012-.053.03a3819 3819 0 01-10.041 5.748c-.004-.524-.008-2.314-.009-4.647zM6.75 18.6l.019-11.975.29.172c.235.136 1.813 1.098 3.596 2.189q1.915 1.173 3.835 2.338l.536.323-1.773 1.084-.354-.206q-1.065-.643-2.122-1.299-1.032-.639-2.07-1.266l-.49-.285-.003 5.077-.005 4.749-.681-.42z", clipRule: "evenodd" }));
}
DEEZ.DefaultColor = DefaultColor;
var DEEZ_default = DEEZ;
//# sourceMappingURL=DEEZ.js.map
