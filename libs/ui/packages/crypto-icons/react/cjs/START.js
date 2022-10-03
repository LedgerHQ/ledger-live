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
  default: () => START_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#01AEF0";
function START({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M15.802 14.167c-.01 1.556-.908 2.88-2.342 3.424a9.189 9.189 0 01-1.033.308c-.208.053-.321.156-.338.383-.02.286-.05.572-.09.855-.048.334-.162.41-.47.337-.53-.126-.586-.211-.516-.767.006-.047.013-.094.018-.142.053-.456-.012-.52-.448-.5-.195.01-.277.107-.296.3-.025.275-.052.552-.097.824-.045.28-.162.348-.43.29-.574-.124-.616-.188-.54-.794.094-.752.091-.744-.603-.953-.308-.093-.606-.222-.907-.341-.183-.072-.243-.209-.193-.412.063-.259.106-.523.16-.785.093-.446.31-.581.722-.42.73.288 1.48.465 2.26.484.705.017 1.402-.03 2.045-.375.424-.23.736-.564.893-1.045.232-.714.024-1.292-.645-1.579-.551-.236-1.143-.367-1.699-.594-.493-.2-1.006-.402-1.432-.718-.958-.708-1.125-1.755-.915-2.873.238-1.26 1.01-2.078 2.155-2.512.305-.115.443-.276.449-.618.004-.372.063-.743.108-1.113.035-.284.146-.363.411-.32.564.092.632.182.576.767-.021.23-.04.458-.067.685-.023.191.038.28.238.285.457.014.477.005.53-.467.035-.304.06-.608.102-.911.045-.336.154-.413.463-.35.522.107.58.187.528.73-.022.238-.033.478-.075.712-.047.27.036.396.304.458.51.118 1.016.268 1.518.424.377.117.392.16.32.552-.043.235-.086.47-.141.702-.104.437-.321.567-.737.427-.71-.24-1.425-.457-2.179-.489-.66-.028-1.31-.018-1.884.397-.807.583-.811 1.77.047 2.27.546.317 1.177.48 1.768.713.361.143.732.266 1.078.438.929.464 1.394 1.239 1.384 2.314"
  }));
}
START.DefaultColor = DefaultColor;
var START_default = START;
//# sourceMappingURL=START.js.map
