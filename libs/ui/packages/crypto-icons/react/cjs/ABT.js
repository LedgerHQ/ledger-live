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
  default: () => ABT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#3EFFFF";
function ABT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M4.875 7.865L12 3.75l7.125 4.115v8.27L12 20.25l-7.125-4.115v-8.27zm.684 7.478l2.857-1.654 1.45-2.539L5.56 8.658v6.685zm.343.593l5.776 3.337V16.08L8.65 14.345l-2.748 1.59v.001zM18.44 8.681l-4.269 2.47 1.449 2.537 2.82 1.631V8.681zm-.322-.606l-5.757-3.324v3.231l1.47 2.574 4.287-2.48zm-4.536 3.417l-.879.508 1.744 1.009-.865-1.518zm-.34-.596l-.88-1.545v2.055l.88-.51zm-3.648 2.111L11.335 12l-.876-.507-.863 1.514zm-.259.942l2.342 1.341v-2.696l-2.342 1.355zM5.901 8.064l4.305 2.49 1.472-2.576v-3.25L5.901 8.063zm12.218 7.86l-2.727-1.577-3.03 1.755v3.148l5.757-3.325zm-3.412-1.973l-2.345-1.357v2.716l2.345-1.36zm-3.909-3.053l.88.508V9.355l-.88 1.543z"
  }));
}
ABT.DefaultColor = DefaultColor;
var ABT_default = ABT;
//# sourceMappingURL=ABT.js.map
