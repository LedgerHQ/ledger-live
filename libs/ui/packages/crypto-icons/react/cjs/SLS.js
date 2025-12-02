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
var SLS_exports = {};
__export(SLS_exports, {
  default: () => SLS_default
});
module.exports = __toCommonJS(SLS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#8e9495";
function SLS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M5.717 15.533a5.2 5.2 0 01-.38-1.16 4 4 0 01-.087-.64h.67a4.6 4.6 0 00.408 1.535c.402.852 1.012 1.338 1.899 1.338.693 0 1.23-.277 1.608-.766.32-.413.502-.961.502-1.422 0-.59-.223-1.025-.67-1.393-.362-.3-.78-.51-1.643-.869l-.152-.063c-.897-.371-1.311-.575-1.714-.893-.556-.44-.852-.985-.852-1.683 0-.836.301-1.545.84-2.046a2.75 2.75 0 011.87-.721c.96 0 1.694.4 2.181 1.1v-.952h2.166v9.56h.644v-2.749l.67.023v.034q.02.244.068.484c.07.349.177.699.327 1.018.4.851 1.011 1.338 1.897 1.338.693 0 1.23-.278 1.608-.767.321-.413.502-.961.502-1.422 0-.59-.223-1.025-.67-1.393-.362-.3-.78-.51-1.642-.869l-.153-.063c-.897-.371-1.31-.575-1.714-.893-.556-.44-.851-.985-.851-1.683 0-.836.3-1.545.839-2.046a2.75 2.75 0 011.871-.72c.96 0 1.693.4 2.18 1.1v-.912h.671v3.317h-.67c0-.693-.16-1.395-.473-1.913-.368-.613-.923-.948-1.708-.948a2.06 2.06 0 00-1.405.539c-.405.378-.635.919-.635 1.583 0 .495.2.863.607 1.185.338.266.716.452 1.554.8l.152.063c.925.383 1.383.614 1.815.97.59.488.903 1.099.903 1.883 0 .597-.227 1.28-.634 1.808-.502.647-1.235 1.025-2.147 1.025-.632 0-1.174-.192-1.62-.547a3 3 0 01-.672-.77v1.17h-1.984V7.541h-.825v2.713h-.671c0-.693-.159-1.395-.472-1.913-.369-.613-.924-.948-1.708-.948a2.06 2.06 0 00-1.405.539c-.405.378-.635.919-.635 1.583 0 .495.2.863.607 1.185.338.266.716.452 1.553.8l.153.063c.925.383 1.383.614 1.815.97.59.488.903 1.099.903 1.883 0 .597-.227 1.28-.635 1.808-.502.647-1.234 1.025-2.146 1.025-.633 0-1.175-.192-1.62-.547a3 3 0 01-.687-.79v1.149h-.67v-3.33h.67v2.18a4 4 0 01-.203-.379" }));
}
SLS.DefaultColor = DefaultColor;
var SLS_default = SLS;
//# sourceMappingURL=SLS.js.map
