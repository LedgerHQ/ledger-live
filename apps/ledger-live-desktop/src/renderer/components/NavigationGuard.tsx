import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Location, UNSAFE_NavigationContext, useLocation, useNavigate } from "react-router";
import { useDispatch } from "LLD/hooks/redux";
import { setNavigationLock } from "~/renderer/actions/application";
import ConfirmModal, { Props as ConfirmModalProps } from "~/renderer/modals/ConfirmModal";

type Props = Omit<
  ConfirmModalProps,
  "isOpened" | "onConfirm" | "onReject" | "onClose" | "analyticsName"
> & {
  when?: boolean;
  noModal?: boolean;
  analyticsName?: string;
  shouldBlockNavigation?: (location: Location) => boolean;
};

const getPathFromHash = (hash: string) => {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  return trimmed || "/";
};

const getPathFromUrl = (url?: string) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return getPathFromHash(parsed.hash);
  } catch {
    const hashIndex = url.indexOf("#");
    if (hashIndex >= 0) {
      return getPathFromHash(url.slice(hashIndex));
    }
  }
  return null;
};

const toLocation = (path: string): Location => {
  const [pathname, searchValue = ""] = path.split("?");
  return {
    pathname: pathname || "/",
    search: searchValue ? `?${searchValue}` : "",
    hash: "",
    state: null,
    key: "navigation-guard",
  };
};

const NavigationGuard = ({
  when = false,
  noModal = false,
  analyticsName = "NavigationGuard",
  shouldBlockNavigation = () => true,
  ...modalProps
}: Props) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationContext = useContext(UNSAFE_NavigationContext);
  const navigator = navigationContext?.navigator;
  const [isOpened, setIsOpened] = useState(false);
  const pendingPathRef = useRef<string | null>(null);
  const pendingTxRef = useRef<{ retry: () => void } | null>(null);
  const ignoreNextHashChangeRef = useRef(false);
  const currentPathRef = useRef(`${location.pathname}${location.search}${location.hash}`);

  useEffect(() => {
    currentPathRef.current = `${location.pathname}${location.search}${location.hash}`;
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    dispatch(setNavigationLock(when));
    return () => {
      dispatch(setNavigationLock(false));
    };
  }, [dispatch, when]);

  useEffect(() => {
    if (!when) {
      setIsOpened(false);
      pendingPathRef.current = null;
    }
  }, [when]);

  const closeModal = useCallback(() => {
    setIsOpened(false);
    pendingPathRef.current = null;
    pendingTxRef.current = null;
  }, []);

  const stayOnPage = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const allowNavigation = useCallback(() => {
    const pendingTx = pendingTxRef.current;
    const pendingPath = pendingPathRef.current;
    closeModal();
    if (pendingTx) {
      pendingTx.retry();
      return;
    }
    if (!pendingPath) {
      return;
    }
    ignoreNextHashChangeRef.current = true;
    navigate(pendingPath);
  }, [closeModal, navigate]);

  const handleHashChange = useCallback(
    (event: HashChangeEvent) => {
      if (!when) return;
      if (ignoreNextHashChangeRef.current) {
        ignoreNextHashChangeRef.current = false;
        return;
      }

      const nextPath = getPathFromHash(window.location.hash);
      const nextLocation = toLocation(nextPath);

      if (!shouldBlockNavigation(nextLocation)) {
        return;
      }

      const previousPath = getPathFromUrl(event.oldURL) ?? currentPathRef.current;

      if (noModal) {
        ignoreNextHashChangeRef.current = true;
        navigate(previousPath, { replace: true });
        return;
      }

      pendingPathRef.current = nextPath;
      setIsOpened(true);
      ignoreNextHashChangeRef.current = true;
      navigate(previousPath, { replace: true });
    },
    [navigate, noModal, shouldBlockNavigation, when],
  );

  useEffect(() => {
    if (!when || !navigator || !("block" in navigator)) {
      return undefined;
    }
    const block = navigator.block;
    if (typeof block !== "function") {
      return undefined;
    }
    const unblock = block((tx: { location: Location; retry: () => void }) => {
      if (!shouldBlockNavigation(tx.location)) {
        tx.retry();
        return;
      }
      if (noModal) {
        return;
      }
      pendingTxRef.current = tx;
      setIsOpened(true);
    });
    return unblock;
  }, [navigator, noModal, shouldBlockNavigation, when]);

  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [handleHashChange]);

  if (noModal) {
    return null;
  }

  return (
    <ConfirmModal
      {...modalProps}
      analyticsName={analyticsName}
      isOpened={isOpened}
      onConfirm={stayOnPage}
      onReject={allowNavigation}
      onClose={stayOnPage}
    />
  );
};

export default NavigationGuard;
