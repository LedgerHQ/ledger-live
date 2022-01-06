import { SearchInput } from "@ledgerhq/native-ui";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import getWindowDimensions from "../../logic/getWindowDimensions";

const { width } = getWindowDimensions();

type Props = {
  search?: string;
  refresh: (params: any) => void;
  onClose: () => void;
  isOpen?: boolean;
};

function SearchHeader({ search, refresh, isOpen, onClose }: Props) {
  const [inputSearch, setInputSearch] = useState(search);
  const animValue = useSharedValue(isOpen ? 1 : 0);
  const ref = useRef();

  const onSubmit = useCallback(() => {
    if (inputSearch !== search)
      refresh({ search: inputSearch, starred: [], liveCompatible: false });
    onClose();
  }, [inputSearch, search, refresh, onClose]);

  useEffect(() => {
    animValue.value = isOpen ? 1 : 0;
    if (isOpen && ref?.current?.focus) ref.current.focus();
  }, [animValue, isOpen]);

  useEffect(() => {
    setInputSearch(search);
  }, [search]);

  const searchInputStyle = useAnimatedStyle(() => {
    const w = width - 80;
    /** offset horizontaly given the scale transformation and potential top left header section */
    const translateX = withTiming(-(animValue.value * (w + 16)), {
      duration: 300,
    });

    const opacity = withTiming(animValue.value, { duration: 300 });

    return {
      position: "absolute",
      right: -w,
      transform: [{ translateX }],
      opacity,
      width: w,
    };
  }, [animValue]);

  return (
    <Animated.View style={searchInputStyle}>
      <SearchInput
        ref={ref}
        value={inputSearch}
        onChange={setInputSearch}
        onSubmitEditing={onSubmit}
        onEndEditing={onSubmit}
      />
    </Animated.View>
  );
}

export default memo<Props>(SearchHeader);
