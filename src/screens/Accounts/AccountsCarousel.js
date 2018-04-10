/* @flow */
import React, { Component } from "react";
import { Dimensions } from "react-native";
import Carousel from "react-native-snap-carousel";
import AccountCard from "./AccountCard";

const windowDim = Dimensions.get("window");

class AccountsCarousel extends Component<{
  topLevelNavigation: *,
  accounts: *,
  selectedIndex: number,
  onSelectIndex: number => void
}> {
  carousel: ?Carousel;
  onCarousel = (ref: ?Carousel) => {
    this.carousel = ref;
  };

  keyExtractor = (item: *) => item.id;

  onItemFullPress = (item: *, index: *) => {
    const { carousel } = this;
    if (carousel && index !== this.props.selectedIndex) {
      carousel.snapToItem(index);
    }
  };

  snapToItem = (...args: *) => {
    const { carousel } = this;
    if (carousel) carousel.snapToItem(...args);
  };

  renderItemFull = ({ item, index }: *) => (
    <AccountCard
      account={item}
      index={index}
      topLevelNavigation={this.props.topLevelNavigation}
      onItemFullPress={this.onItemFullPress}
    />
  );

  render() {
    const { accounts, onSelectIndex, selectedIndex } = this.props;
    return (
      <Carousel
        ref={this.onCarousel}
        data={accounts}
        keyExtractor={this.keyExtractor}
        itemWidth={280}
        itemHeight={220}
        sliderWidth={windowDim.width}
        sliderHeight={300}
        inactiveSlideOpacity={0.4}
        onSnapToItem={onSelectIndex}
        firstItem={selectedIndex}
        renderItem={this.renderItemFull}
      />
    );
  }
}

export default AccountsCarousel;
