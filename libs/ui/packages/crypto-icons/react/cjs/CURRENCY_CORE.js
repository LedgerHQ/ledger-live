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
var CURRENCY_CORE_exports = {};
__export(CURRENCY_CORE_exports, {
  default: () => CURRENCY_CORE_default
});
module.exports = __toCommonJS(CURRENCY_CORE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fd8f17";
function CURRENCY_CORE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 3.031l.27.059.69.39.72.418 1.558.903.723.418.84.48.719.422 1.558.899.453.27.207.179.063.12v8.7l-.121.18-.18.152-.84.48-.781.45-.719.418-1.558.902-.723.418-.84.48-.777.45-.723.422-.36.18-.148.03-.27-.09-.75-.421-.66-.39-3.12-1.802-.72-.418-1.562-.902-.48-.297-.149-.18-.03-.062v-8.7l.089-.148.27-.21.48-.27.512-.3 3.12-1.802.72-.418 1.558-.902.633-.36.238-.12zm-.031 1.89l-.809.477-.691.391-.719.422-.781.45-.84.48-.57.328-.778.453-.722.418-.118.09v6.992l.149.148.601.328.508.301.781.45.84.48.508.3 2.344 1.352.328.207.121-.027.777-.45.723-.421.84-.48.719-.419.84-.48.718-.422.782-.45.539-.3.09-.09V8.43l-.239-.148-.719-.422-1.562-.898-.719-.422-2.34-1.348-.39-.242zm0 0" }), /* @__PURE__ */ React.createElement("path", { d: "M16.559 9.93h.09v5.101l-.81.48-.839.477-.719.422-.781.45-.719.421h-.09V12l.66-.36.84-.449.688-.363.422-.238.48-.238zm0 0" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6.602l.3.09.72.417.69.391.72.422.78.45.84.48.598.359-.027.117-.633.363-.148-.03-2.34-1.352-.719-.418-.691-.391-.149.031-.75.418-.511.301-.782.45-.84.48-.718.422-.149.09-.03 4.527.179.062 1.558.899.84.48 1.23.719.09.152-.027.75-.152-.031-.508-.3-3.121-1.802-.66-.386-.149-.121-.062-.211V9.39l.09-.152.242-.18.719-.417 1.558-.903.723-.418.777-.449.422-.242zm0 0" }));
}
CURRENCY_CORE.DefaultColor = DefaultColor;
var CURRENCY_CORE_default = CURRENCY_CORE;
//# sourceMappingURL=CURRENCY_CORE.js.map
