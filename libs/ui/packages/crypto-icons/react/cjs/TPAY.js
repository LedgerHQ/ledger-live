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
var TPAY_exports = {};
__export(TPAY_exports, {
  default: () => TPAY_default
});
module.exports = __toCommonJS(TPAY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3058a6";
function TPAY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 20.417a8.418 8.418 0 110-16.835 8.418 8.418 0 010 16.835m0-17.37c-4.937 0-8.953 4.016-8.953 8.953S7.063 20.953 12 20.953s8.953-4.016 8.953-8.953S16.938 3.047 12 3.047" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.153 15.203l-.467 2.024-.113.49h-.502l-2.584-.002h-.01c-1.036-.017-1.85-.293-2.383-.779.461.813 1.439 1.283 2.804 1.305h.01l2.584.002h.502l.113-.49.468-2.024-.365-.773zm-.812-8.679l-.37-.767-.052.24-.35 1.595h.537zm1.865 1.846l-.465 1.969-.115.486h-2.8l-.711 3.246a2 2 0 00-.024.24.3.3 0 00.01.089q.08.03.167.028h.306l.673-3.076h2.8l.115-.487.465-1.969-.362-.777zm-6.947 2.455H7.31l.672.527h1.164z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.33 15.06h-.072c-.543-.013-.8-.296-.8-.75 0-.107.018-.25.037-.358l.823-3.759h2.808l.465-1.968h-2.808l.519-2.363h-2.29l-.52 2.363H8.006l-.447 1.968h2.486l-.968 4.422a3 3 0 00-.071.59c0 1.261.995 1.854 2.481 1.879h2.583l.467-2.023z", clipRule: "evenodd" }));
}
TPAY.DefaultColor = DefaultColor;
var TPAY_default = TPAY;
//# sourceMappingURL=TPAY.js.map
