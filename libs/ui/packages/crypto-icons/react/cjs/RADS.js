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
  default: () => RADS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function RADS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.603 5.746a2.856 2.856 0 110 5.712 2.856 2.856 0 010-5.712zm2.855 9.652a2.857 2.857 0 11-2.856-2.856 3.94 3.94 0 003.94-3.94 2.856 2.856 0 112.856 2.857 3.94 3.94 0 00-3.94 3.94zm3.94 2.856a2.856 2.856 0 110-5.712 2.856 2.856 0 010 5.712zm0-1.995a.861.861 0 100-1.722.861.861 0 000 1.722zm-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722zm6.795-6.796a.86.86 0 100-1.722.86.86 0 000 1.722zm-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.603 5.746a2.856 2.856 0 110 5.712 2.856 2.856 0 010-5.712zm2.855 9.652a2.856 2.856 0 11-2.856-2.856 3.94 3.94 0 003.94-3.94 2.855 2.855 0 112.856 2.857 3.94 3.94 0 00-3.94 3.94zm3.94 2.856a2.856 2.856 0 110-5.712 2.856 2.856 0 010 5.712zm0-1.995a.861.861 0 100-1.723.861.861 0 000 1.723zm-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722zm6.795-6.796a.861.861 0 100-1.723.861.861 0 000 1.723zm-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722z"
  }));
}
RADS.DefaultColor = DefaultColor;
var RADS_default = RADS;
//# sourceMappingURL=RADS.js.map
