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
var AXL_exports = {};
__export(AXL_exports, {
  default: () => AXL_default
});
module.exports = __toCommonJS(AXL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#b2b6bc";
function AXL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 19 19", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M3.746 1.137L2.61 2.273l.602.579c.336.32 1.754 1.71 3.156 3.074C8.75 8.254 8.965 8.43 9.418 8.43c.27 0 .656-.082.86-.188.199-.105 1.671-1.512 3.277-3.117l2.902-2.918L14.25 0 9.566 4.684 7.226 2.34 4.884 0zM1.137 3.746l-1.07 1.07 4.617 4.618-2.344 2.34L0 14.116l1.098 1.098 1.109 1.098 3.106-3.04c3.277-3.21 3.425-3.425 3.105-4.28-.121-.31-5.957-6.317-6.145-6.317-.039 0-.546.48-1.136 1.07m12.617 1.833c-1.59 1.606-2.957 3.05-3.035 3.211-.082.164-.149.524-.149.793 0 .48.16.668 3.106 3.625l3.117 3.117L19 14.117l-2.273-2.277c-1.247-1.258-2.278-2.34-2.278-2.434 0-.082 1.047-1.152 2.305-2.367l2.312-2.223-1.07-1.07c-.59-.59-1.125-1.07-1.203-1.07-.082 0-1.445 1.312-3.04 2.902m-4.855 5.047c-.214.105-1.726 1.512-3.343 3.145l-2.946 2.957 1.11 1.097 1.097 1.11L9.5 14.25l4.684 4.684 1.109-1.11 1.11-1.113-2.981-2.969c-1.649-1.633-3.133-3.039-3.293-3.133-.375-.214-.734-.214-1.23.016m0 0" }));
}
AXL.DefaultColor = DefaultColor;
var AXL_default = AXL;
//# sourceMappingURL=AXL.js.map
