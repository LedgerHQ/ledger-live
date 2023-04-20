import { app, Menu, MenuItemConstructorOptions } from "electron";
import { getMainWindow } from "./window-lifecycle";
const { DEV_TOOLS, DEV_TOOLS_MODE } = process.env;
const template: MenuItemConstructorOptions[] = [
  {
    label: app.name,
    submenu: [
      {
        role: "hide",
      },
      {
        role: "hideOthers",
      },
      {
        role: "unhide",
      },
      {
        type: "separator",
      },
      {
        role: "quit",
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Undo",
        accelerator: "CmdOrCtrl+Z",
        // @ts-expect-error TODO: check if selector is correct
        selector: "undo:",
      },
      {
        label: "Redo",
        accelerator: "Shift+CmdOrCtrl+Z",
        // @ts-expect-error TODO: check if selector is correct
        selector: "redo:",
      },
      {
        type: "separator",
      },
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        // @ts-expect-error TODO: check if selector is correct
        selector: "cut:",
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        // @ts-expect-error TODO: check if selector is correct
        selector: "copy:",
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        // @ts-expect-error TODO: check if selector is correct
        selector: "paste:",
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        // @ts-expect-error TODO: check if selector is correct
        selector: "selectAll:",
      },
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
                const mainWindow = getMainWindow();
                mainWindow?.webContents.openDevTools({
                  // @ts-expect-error DEV_TOOLS_MODE is a string
                  mode: DEV_TOOLS_MODE || "bottom",
                });
              },
            },
            {
              type: "separator",
            },
          ]
        : []),
      {
        role: "close",
      },
      {
        role: "minimize",
      },
      {
        role: "zoom",
      },
      {
        type: "separator",
      },
      {
        role: "front",
      },
    ] as MenuItemConstructorOptions[],
  },
];

/*
 https://www.electronjs.org/docs/api/menu#menusetapplicationmenumenu
 To get rid of the menubar on windows/linux we need `null` ↓
*/
export default process.platform === "darwin" ? Menu.buildFromTemplate(template) : null;
