import EventEmitter from "events";
import React, { PropsWithChildren, createContext, useCallback, useContext, useState } from "react";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigatorName } from "~/const";
import type { DrawerProps, RootDrawerProps } from "~/components/RootDrawer/types";

const rootDrawerEmitter = new EventEmitter();

type RootDrawerContext = {
  drawer: DrawerProps;
  isOpen: boolean;
  onModalHide(): void;
  onClose(cb?: () => void): void;
  openDrawer(): void;
};

export const RootDrawerContext = createContext<RootDrawerContext>({
  drawer: {} as DrawerProps,
  isOpen: false,
  onModalHide: () => undefined,
  onClose: cb => {
    if (cb) cb();
  },
  openDrawer: () => undefined,
});

export function useRootDrawerContext() {
  const ctx = useContext(RootDrawerContext);
  return ctx;
}

export function RootDrawerProvider({ drawer, children }: PropsWithChildren<RootDrawerProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation<StackNavigationProp<ParamListBase, string, NavigatorName>>();

  const onModalHide = () => {
    const parent = navigation.getParent(NavigatorName.RootNavigator);
    if (parent) {
      parent.setParams({ drawer: undefined });
    }

    /*
     * The timeout is there to allow the params to be set to undefined
     * before emitting the event which will then trigger the close callback.
     * Without this the callback will be called before the setParams effect takes
     * hold and the user will be unable to go to whatever navigation is called in
     * the onClose callback.
     * If Params are not set to undefined then we will run into an issue on the
     * account stake button where the user could only trigger it once.
     */
    setTimeout(() => {
      rootDrawerEmitter.emit("ll-root-drawer-on-modal-hide");
    }, 0);
  };

  const onClose = useCallback(
    (callback?: () => void) => {
      setIsOpen(false);

      if (callback) {
        rootDrawerEmitter.once("ll-root-drawer-on-modal-hide", callback);
      }
    },
    [setIsOpen],
  );

  const openDrawer = useCallback(() => setIsOpen(true), [setIsOpen]);

  if (!drawer) return null;

  return (
    <RootDrawerContext.Provider value={{ isOpen, onClose, openDrawer, onModalHide, drawer }}>
      {children}
    </RootDrawerContext.Provider>
  );
}
