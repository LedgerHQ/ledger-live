// Stub for UiAutomator class
import { StepDescription } from '../../types';
import { msg } from '../../utils';

export class UiAutomator {
  static uiDevice(): UiDevice {
    return UiDevice;
  }
}

export class UiDevice {
  static click(x: any, y: any): StepDescription {
    return msg(`Click at (${x}, ${y})`, { x, y });
  }

  static pressBack(): StepDescription {
    return msg('Press back button');
  }

  static pressKeyCode(keyCode: any, metaState?: any): StepDescription {
    return msg(`Press key code ${keyCode}`, { keyCode, metaState });
  }

  static swipe(startX: any, startY: any, endX: any, endY: any, steps: any): StepDescription {
    return msg(`Swipe from (${startX}, ${startY}) to (${endX}, ${endY})`, {
      start_x: startX,
      start_y: startY,
      end_x: endX,
      end_y: endY,
      steps,
    });
  }

  static setCompressedLayoutHeirarchy(compressed: any): StepDescription {
    return msg(`Set compressed layout hierarchy to ${compressed}`, { compressed });
  }

  static getInstance(): StepDescription {
    return msg('Get UI device instance');
  }

  static getDisplaySizeDp(): StepDescription {
    return msg('Get display size in DP');
  }

  static getProductName(): StepDescription {
    return msg('Get product name');
  }

  static getLastTraversedText(): StepDescription {
    return msg('Get last traversed text');
  }

  static clearLastTraversedText(): StepDescription {
    return msg('Clear last traversed text');
  }

  static pressMenu(): StepDescription {
    return msg('Press menu button');
  }

  static pressHome(): StepDescription {
    return msg('Press home button');
  }

  static pressSearch(): StepDescription {
    return msg('Press search button');
  }

  static pressDPadCenter(): StepDescription {
    return msg('Press D-pad center');
  }

  static pressDPadDown(): StepDescription {
    return msg('Press D-pad down');
  }

  static pressDPadUp(): StepDescription {
    return msg('Press D-pad up');
  }

  static pressDPadLeft(): StepDescription {
    return msg('Press D-pad left');
  }

  static pressDPadRight(): StepDescription {
    return msg('Press D-pad right');
  }

  static pressDelete(): StepDescription {
    return msg('Press delete button');
  }

  static pressEnter(): StepDescription {
    return msg('Press enter button');
  }

  static pressRecentApps(): StepDescription {
    return msg('Press recent apps button');
  }

  static openNotification(): StepDescription {
    return msg('Open notification drawer');
  }

  static openQuickSettings(): StepDescription {
    return msg('Open quick settings');
  }

  static getDisplayWidth(): StepDescription {
    return msg('Get display width');
  }

  static getDisplayHeight(): StepDescription {
    return msg('Get display height');
  }

  static drag(startX: any, startY: any, endX: any, endY: any, steps: any): StepDescription {
    return msg(`Drag from (${startX}, ${startY}) to (${endX}, ${endY})`, {
      start_x: startX,
      start_y: startY,
      end_x: endX,
      end_y: endY,
      steps,
    });
  }

  static waitForIdle(): StepDescription {
    return msg('Wait for idle');
  }

  static getCurrentActivityName(): StepDescription {
    return msg('Get current activity name');
  }

  static getCurrentPackageName(): StepDescription {
    return msg('Get current package name');
  }

  static removeWatcher(name: any): StepDescription {
    return msg(`Remove watcher "${name}"`, { name });
  }

  static runWatchers(): StepDescription {
    return msg('Run watchers');
  }

  static resetWatcherTriggers(): StepDescription {
    return msg('Reset watcher triggers');
  }

  static hasWatcherTriggered(watcherName: any): StepDescription {
    return msg(`Check if watcher "${watcherName}" has triggered`, { watcherName });
  }

  static hasAnyWatcherTriggered(): StepDescription {
    return msg('Check if any watcher has triggered');
  }

  static setWatcherTriggered(watcherName: any): StepDescription {
    return msg(`Set watcher "${watcherName}" as triggered`, { watcherName });
  }

  static isNaturalOrientation(): StepDescription {
    return msg('Check if orientation is natural');
  }

  static getDisplayRotation(): StepDescription {
    return msg('Get display rotation');
  }

  static freezeRotation(): StepDescription {
    return msg('Freeze rotation');
  }

  static unfreezeRotation(): StepDescription {
    return msg('Unfreeze rotation');
  }

  static setOrientationLeft(): StepDescription {
    return msg('Set orientation to left');
  }

  static setOrientationRight(): StepDescription {
    return msg('Set orientation to right');
  }

  static setOrientationNatural(): StepDescription {
    return msg('Set orientation to natural');
  }

  static wakeUp(): StepDescription {
    return msg('Wake up device');
  }

  static isScreenOn(): StepDescription {
    return msg('Check if screen is on');
  }

  static sleep(): StepDescription {
    return msg('Put device to sleep');
  }

  static dumpWindowHierarchy(fileName: any): StepDescription {
    return msg(`Dump window hierarchy to "${fileName}"`, { fileName });
  }
}
