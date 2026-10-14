import { app, Menu, MenuItemConstructorOptions } from "electron";
import { getMainWindow, isDevToolsMode } from "./window-lifecycle";
const { DEV_TOOLS, DEV_TOOLS_MODE } = process.env;

const template: MenuItemConstructorOptions[] = [
  {
    label: app.name,
    submenu: [
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    role: "window",
    submenu: [
      ...(__DEV__ || DEV_TOOLS
        ? [
            {
              label: "Main Window Dev Tools",
              click() {
                getMainWindow()?.webContents.openDevTools({
                  mode: isDevToolsMode(DEV_TOOLS_MODE) ? DEV_TOOLS_MODE : "bottom",
                });
              },
            },
            {
              type: "separator",
            },
          ]
        : []),
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ] as MenuItemConstructorOptions[],
  },
];

/*
 https://www.electronjs.org/docs/api/menu#menusetapplicationmenumenu
 To get rid of the menubar on windows/linux we need `null` ↓
*/
export default process.platform === "darwin" ? Menu.buildFromTemplate(template) : null;
