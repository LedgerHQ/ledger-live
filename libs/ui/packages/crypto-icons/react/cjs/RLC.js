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
var RLC_exports = {};
__export(RLC_exports, {
  default: () => RLC_default
});
module.exports = __toCommonJS(RLC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ffd800";
function RLC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M16.637 9.665c.043-.043.128-.043.211-.043 1.265 0 2.277 1.07 2.277 2.357 0 1.2-.885 2.143-2.023 2.357h-.254a2.5 2.5 0 01-1.222-.343.7.7 0 00-.422-.129.84.84 0 00-.463.129c-.296.172-.422.471-.422.814v.386a2.31 2.31 0 01-2.024 2.1h-.253c-.421 0-.843-.128-1.223-.343a.95.95 0 00-.463-.128.84.84 0 00-.464.128c-.295.172-.422.472-.422.815v.385c-.084 1.115-.97 1.972-2.065 2.1h-.211c-1.265 0-2.277-1.072-2.277-2.357.042-1.2.885-2.186 2.024-2.315h.253c.422 0 .843.13 1.222.344a.7.7 0 00.422.128.84.84 0 00.464-.128c.295-.172.421-.472.421-.815-.084-1.242.802-2.357 2.024-2.485H12c.422 0 .843.128 1.223.342a.95.95 0 00.464.129.84.84 0 00.463-.129c.295-.171.422-.471.422-.814-.084-1.243.843-2.357 2.065-2.485M11.79 6.707c.084-.042.127-.042.253-.042 1.265 0 2.277 1.07 2.277 2.357-.042 1.2-.885 2.185-2.024 2.313h-.253c-.422 0-.843-.128-1.223-.342a.7.7 0 00-.421-.129.84.84 0 00-.464.129c-.295.172-.422.471-.422.814v.386c-.084 1.114-.969 1.97-2.065 2.1h-.211c-1.265 0-2.277-1.071-2.277-2.357 0-1.157.843-2.1 1.981-2.271h.254c.421 0 .843.128 1.222.342a.7.7 0 00.422.129.84.84 0 00.463-.129c.296-.171.422-.471.422-.814-.084-1.243.844-2.357 2.066-2.486M7.152 3.75c1.257 0 2.276 1.037 2.276 2.315 0 1.277-1.02 2.313-2.276 2.313-1.258 0-2.277-1.035-2.277-2.314 0-1.277 1.02-2.314 2.277-2.314", clipRule: "evenodd" }));
}
RLC.DefaultColor = DefaultColor;
var RLC_default = RLC;
//# sourceMappingURL=RLC.js.map
