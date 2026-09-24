import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";

type RouteLike = Readonly<{ name: string; state?: NavigationStateLike }>;

export type NavigationStateLike = Readonly<{ routes?: readonly RouteLike[] }> | undefined;

export function hasRouteNamed(state: NavigationStateLike, name: string): boolean {
  return (state?.routes ?? []).some(
    route => route.name === name || hasRouteNamed(route.state, name),
  );
}

export function useIsRouteMounted(name: string): boolean {
  const navigation = useNavigation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const read = () => setIsMounted(hasRouteNamed(navigation.getState(), name));

    read();

    return navigation.addListener("state", read);
  }, [name, navigation]);

  return isMounted;
}
