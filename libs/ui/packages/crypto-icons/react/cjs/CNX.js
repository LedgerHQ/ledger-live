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
var CNX_exports = {};
__export(CNX_exports, {
  default: () => CNX_default
});
module.exports = __toCommonJS(CNX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4c6bae";
function CNX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M4.787 12.758l-1.037.107q.832-2.33 3.293-3.726.232 1.93 1.83 3.194l-.975.101a4.13 4.13 0 003.415 3.634 4.56 4.56 0 01-2.24.889q.765 1.35 1.813 2.21a7.255 7.255 0 01-6.099-6.41m14.426-1.515l1.037-.108q-.832 2.33-3.293 3.726-.232-1.93-1.83-3.194l.975-.101a4.13 4.13 0 00-3.47-3.643 4.56 4.56 0 012.23-.88q-.773-1.36-1.83-2.222a7.255 7.255 0 016.18 6.422", clipRule: "evenodd", opacity: 0.5 }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.692 19.22l.107 1.03q-2.33-.832-3.726-3.293 1.929-.232 3.193-1.83l.102.982a4.13 4.13 0 003.709-3.477c.486.652.79 1.421.88 2.23q1.36-.773 2.222-1.83a7.255 7.255 0 01-6.487 6.188m-1.45-14.433l-.107-1.037q2.33.832 3.726 3.293-1.93.232-3.194 1.83l-.101-.975a4.13 4.13 0 00-3.643 3.47 4.56 4.56 0 01-.88-2.23q-1.36.773-2.222 1.83a7.256 7.256 0 016.422-6.18", clipRule: "evenodd" }));
}
CNX.DefaultColor = DefaultColor;
var CNX_default = CNX;
//# sourceMappingURL=CNX.js.map
