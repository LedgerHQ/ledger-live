var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => NGC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F80000";
function NGC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M15 12.632L9.978 19.5l.185-5.58H9l.476-4.9 5.313-.732-1.745 4.444 1.956-.1zm-4.123 4.873v-1.313a.181.181 0 00-.185-.177.181.181 0 00-.185.177v1.313c0 .098.082.177.185.177a.18.18 0 00.184-.177zm-1.375-3.964h1.058l-.049 2.02c0 .053.02.104.06.142.039.037.092.06.147.06h.01a.203.203 0 00.206-.194l.048-2.383H9.925l.354-3.914a.16.16 0 00-.044-.123.172.172 0 00-.125-.053h-.03a.167.167 0 00-.17.148l-.408 4.296zm0-4.95l1.957-1.616c.104-1.616-.953-1.869-.953-1.869l.159-.606c1.745.505 1.48 2.424 1.48 2.424l2.538 1.06-5.18.607z"
  }));
}
NGC.DefaultColor = DefaultColor;
var NGC_default = NGC;
//# sourceMappingURL=NGC.js.map
