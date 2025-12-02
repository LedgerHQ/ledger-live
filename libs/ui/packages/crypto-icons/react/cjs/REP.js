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
var REP_exports = {};
__export(REP_exports, {
  default: () => REP_default
});
module.exports = __toCommonJS(REP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#602a52";
function REP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.061 12.234a3.2 3.2 0 00-1.072-1.467l-.006-.006a3 3 0 00-.16-.113l-.01-.008a4 4 0 00-.164-.1l-.014-.01a2 2 0 00-.168-.086l-.016-.009-.177-.079-.02-.007a3.3 3.3 0 00-.597-.183 2.3 2.3 0 01-.448.572c.42.034.828.168 1.186.392l.02.012.099.068.045.031.088.068.05.04q.04.034.078.069l.05.048.07.07.052.056.062.072.048.061.057.075.046.066c.015.022.035.05.05.077l.044.072.043.076.041.08c.013.027.026.049.037.075l.04.1q.107.268.15.552l.082.303c.034.126.353 1.242 1.092 1.618.847.434 1.968.97 2.409 1.182l-5.824 3.42v-2.343c0-.37.75-.803 1.097-.955l.02-.011q.108-.053.21-.114l.03-.015q.225-.136.427-.306l.036-.032.041-.037q.063-.056.124-.117l.02-.02c.045-.044.09-.086.128-.138l.037-.042q.05-.059.095-.119l.027-.034q.056-.075.107-.152l.012-.015q.068-.109.131-.221a3.3 3.3 0 01-.417-.642q-.07.195-.172.376l-.089.153-.014.02-.088.124-.027.035q-.046.06-.096.114l-.018.021a2.6 2.6 0 01-.764.574l-.055.028c-.148.065-1.45.643-1.45 1.521v2.345l-5.842-3.427c.376-.229 1.474-.868 2.377-1.15.353-.107 1.103.355 1.528.695l.025.023q.085.078.178.15l.02.018q.204.162.43.29l.101.055.02.011q.149.075.302.134l.045.017.03.012q.222.081.454.128.183-.326.462-.576a2.6 2.6 0 01-.72-.157l-.04-.015-.077-.031-.039-.017-.074-.034a2.6 2.6 0 01-.484-.305l-.232-.207a4.3 4.3 0 00-.69-.484c-.578-.323-1.061-.428-1.431-.314-.773.239-1.643.702-2.174 1.008l5.834-10.288v4.506c0 .16-.24.576-1.042.93l-.056.03a3 3 0 00-.228.122l-.015.008a3.2 3.2 0 00-.673.527l-.008.008q-.114.117-.215.245l-.008.011-.095.127-.011.015q-.042.06-.081.123l-.009.013-.076.13-.017.03q-.032.067-.065.127l-.01.02q-.03.06-.055.12l-.019.045q-.026.065-.048.127l-.015.045-.032.098-.015.054q-.066.226-.094.46l-.008.07-.008.095c-.002.032 0 .063-.005.095-.006.032 0 .039 0 .06v.071q0 .237.036.472a3.3 3.3 0 01.724.27 2.5 2.5 0 01-.112-.7v-.042q-.002-.084.006-.173v-.045c0-.049.01-.098.017-.147v-.021a2 2 0 01.031-.162l.01-.04q.015-.069.036-.133l.01-.029q.022-.078.053-.152l.014-.034.054-.124.014-.031a3 3 0 01.075-.143l.014-.024.075-.12.018-.027.096-.134.006-.008.1-.12.02-.022q.239-.262.54-.452l.275-.128c.148-.065 1.444-.658 1.444-1.537V4.955l5.88 10.365c-.526-.252-1.448-.699-2.168-1.065-.411-.21-.692-.95-.764-1.215l-.079-.311a3 3 0 00-.129-.492zm3.983 3.263l-6.48-11.42a.65.65 0 00-.568-.327.65.65 0 00-.566.327l-6.473 11.42a.627.627 0 00.232.852l6.478 3.81a.66.66 0 00.666 0l6.477-3.806a.627.627 0 00.234-.852l.001-.004z", clipRule: "evenodd" }));
}
REP.DefaultColor = DefaultColor;
var REP_default = REP;
//# sourceMappingURL=REP.js.map
