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
var ARN_exports = {};
__export(ARN_exports, {
  default: () => ARN_default
});
module.exports = __toCommonJS(ARN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0092b5";
function ARN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.82 10.202l3.211-5.654c.006-.01.018-.017.06 0l3.056 5.55a.732.732 0 00.018 1.15l-2.822 5.09a.76.76 0 00-.645-.004L8.793 11.16a.73.73 0 00.026-.959m-.308 1.15l2.916 5.194a.7.7 0 00-.135.267q-3.531-.846-4.389-1.047a7 7 0 01-.633-1.079l1.87-3.29a.76.76 0 00.371-.044zM8.108 9.94L5.793 5.815Q8.16 4.557 11.669 4.5L8.547 9.995a.76.76 0 00-.44-.055m-.315.132a.733.733 0 00.025 1.206L6.101 14.3a7.1 7.1 0 01-.503-2.215l-.347-5.537a.67.67 0 01.25-.56zm4.95 6.748a.7.7 0 00-.131-.266l2.863-5.165a.8.8 0 00.372-.018l1.856 3.37a7 7 0 01-.543.934zm-.556.9a.75.75 0 00.56-.554l4.092-1.061a7.2 7.2 0 01-1.752 1.569l-2.717 1.735a.7.7 0 01-.183.083zm-.34 0v1.78a.7.7 0 01-.218-.09l-2.717-1.736a7.3 7.3 0 01-1.685-1.487q1.114.264 4.057.968c.06.28.28.502.563.566m4.027-7.75a.76.76 0 00-.423-.021l-2.998-5.447q3.411.076 5.731 1.301zm.287.18l2.318-4.179a.67.67 0 01.27.577l-.347 5.538a7.1 7.1 0 01-.525 2.268l-1.736-3.152a.73.73 0 00.02-1.052M12 8.05a.41.41 0 00-.406.401v1.465L9.429 11.25l.232.5 1.933-.633v1.466l-.542.4v.4l.948-.268.947.267v-.4l-.542-.4v-1.466l1.9.668.265-.534-2.165-1.334V8.452a.413.413 0 00-.405-.4" }));
}
ARN.DefaultColor = DefaultColor;
var ARN_default = ARN;
//# sourceMappingURL=ARN.js.map
