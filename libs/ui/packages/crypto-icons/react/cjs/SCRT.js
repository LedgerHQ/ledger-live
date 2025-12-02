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
var SCRT_exports = {};
__export(SCRT_exports, {
  default: () => SCRT_default
});
module.exports = __toCommonJS(SCRT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#151a20";
function SCRT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 1000 1000", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M853.568 146.5C759.083 52 633.57 0 500.05 0 224.302 0 0 224.3 0 500s224.302 500 500.05 500c133.52 0 259.133-52 353.518-146.5C948.053 759 1000 633.5 1000 500s-51.947-259.1-146.432-353.5M500.05 965.4C243.419 965.4 34.631 756.6 34.631 500S243.42 34.6 500.05 34.6 965.469 243.4 965.469 500 756.681 965.4 500.05 965.4" }), /* @__PURE__ */ React.createElement("path", { d: "M663.879 511.702c-31.991-28.591-73.878-47.686-114.467-66.18l-.299-.1c-71.58-32.691-133.462-60.982-129.063-127.863 1.9-25.493 20.394-40.888 35.59-49.186 17.095-9.397 39.788-14.995 60.782-14.995 2.499 0 4.999.1 7.398.2 61.082 4.098 109.268 29.991 156.354 83.775l2.8 3.299 3.299-2.799 18.394-15.995 3.299-2.899-2.899-3.299c-52.485-60.183-109.468-90.474-179.148-95.173-2.999-.3-6.198-.4-9.697-.4-2.099 0-4.399 0-6.798.1h-2.999c-45.687 0-95.772 14.996-133.861 40.189-45.487 30.091-70.979 71.479-71.679 116.566-1.8 109.668 87.874 146.557 166.951 179.248l.2.099.8.3c69.98 28.992 130.362 53.985 129.062 120.965-.599 44.187-63.781 68.58-107.168 68.58h-6.099v.1c-64.681-1.899-122.464-29.791-171.75-82.676l-2.999-3.199-3.199 2.899-17.895 16.596-3.199 2.999 2.999 3.199c55.984 60.282 125.064 92.673 199.842 93.572h3.399c48.286 0 100.771-12.996 140.359-34.889 49.586-27.093 78.478-66.581 81.477-111.168 3.399-48.986-12.897-88.874-49.786-121.865M431.747 416.33c28.492 24.393 67.08 41.888 104.369 58.783l.7.3c39.489 18.195 76.878 35.39 103.97 59.283 29.991 26.392 42.687 56.983 39.988 96.272-2.499 38.888-31.391 64.881-57.683 80.576 5.099-10.397 7.898-21.693 8.198-33.69.599-40.388-14.896-72.679-47.487-98.871-28.491-22.893-66.28-38.389-102.87-53.485-76.077-31.29-147.956-60.882-146.657-148.256.4-33.591 20.594-65.381 56.884-89.474 1.199-.8 2.399-1.6 3.699-2.4-4.299 9.398-6.699 19.195-7.298 29.492-2.899 40.488 11.596 73.678 44.187 101.47" }));
}
SCRT.DefaultColor = DefaultColor;
var SCRT_default = SCRT;
//# sourceMappingURL=SCRT.js.map
