import { Icons } from "@ledgerhq/react-ui";
import useEmblaCarousel, { UseEmblaCarouselType } from "embla-carousel-react";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Footer from "./footer";

type Props = {
  slides: {
    id: number | string;
    Component: () => React.JSX.Element;
  }[];
};

const CarouselContainer = styled.div`
  padding: 12px 16px 12px 16px;
`;

const Embla = styled.div`
  overflow: hidden;
`;

const EmblaContainer = styled.div`
  display: flex;
`;

const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
`;

const Carousel = ({ slides }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = () => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.scrollTo(emblaApi.selectedScrollSnap());
  };

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div>
      <CarouselContainer>
        <Embla ref={emblaRef}>
          <EmblaContainer>
            {slides.map(({ id, Component }) => (
              <EmblaSlide key={id}>
                <Component />
              </EmblaSlide>
            ))}
          </EmblaContainer>
        </Embla>
      </CarouselContainer>

      <Footer slides={slides} emblaApi={emblaApi} index={currentIndex} />
    </div>
  );
};

export default Carousel;
