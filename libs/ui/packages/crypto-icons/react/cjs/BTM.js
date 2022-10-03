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
  default: () => BTM_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#504C4C";
function BTM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.12 11.532l-1.308 2.774.608 2.274 1.55.414 1.923 1.925-.579.581-4.584-1.23-1.23-4.584.923-.921 4.006-4.007-1.309 2.774-1.308 2.774 4.081-4.082-1.464-1.466-1.309 2.774zm2.104 1.575l4.082 4.082 2.274-.61.415-1.549 1.924-1.923.581.579-1.229 4.585-4.585 1.229-4.927-4.929 1.465-1.464zm3.552-2.214L9.694 6.811l-2.275.61-.414 1.547-1.924 1.925-.581-.579 1.23-4.585L10.314 4.5l.921.923 4.005 4.005-1.464 1.465zm1.254-3.888l-1.923-1.924.579-.581 4.585 1.229 1.229 4.585-4.929 4.927-1.464-1.465 4.083-4.083-.61-2.274-1.55-.414z"
  }));
}
BTM.DefaultColor = DefaultColor;
var BTM_default = BTM;
//# sourceMappingURL=BTM.js.map
