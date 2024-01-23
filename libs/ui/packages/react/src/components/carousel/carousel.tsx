/**
 * This component uses the https://github.com/davidjerleke/embla-carousel library.
 */

import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Footer from "./footer";
import { Props } from "./types";

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

const Carousel = (props: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.scrollTo(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div>
      <Embla ref={emblaRef}>
        <EmblaContainer>
          {props.slides.map(({ id, Component }) => (
            <EmblaSlide key={id}>
              <Component />
            </EmblaSlide>
          ))}
        </EmblaContainer>
      </Embla>

      <Footer {...props} emblaApi={emblaApi} index={currentIndex} />
    </div>
  );
};

export default Carousel;
