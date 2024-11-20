import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Footer from "./Footer";
import { Props } from "./types";
import { ChevronArrow } from "./ChevronArrow";

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

const CarouselContainer = styled.div<Pick<Props, "variant">>`
  position: relative;

  --hover-transition: 0;
  &:hover {
    --hover-transition: 1;
  }
`;

/**
 * This component uses the https://github.com/davidjerleke/embla-carousel library.
 */
const Carousel = ({ children, variant = "default" }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const updateIndex = useCallback(() => {
    if (!emblaApi) return;

    const newIndex = emblaApi.selectedScrollSnap();
    setCurrentIndex(newIndex);
    emblaApi.scrollTo(newIndex);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Initial call to update carousel index
    updateIndex();

    // When the selected scroll snap changes
    emblaApi.on("select", updateIndex);

    // When `reInit` is called or when window is resized
    emblaApi.on("reInit", updateIndex);
  }, [emblaApi, updateIndex]);

  const handleGotoPrevSlide = () => emblaApi?.scrollPrev();
  const handleGotoNextSlide = () => emblaApi?.scrollNext();

  return (
    <div>
      <CarouselContainer variant={variant}>
        {variant === "default" && children.length > 1 && (
          <>
            <ChevronArrow direction="left" onClick={handleGotoPrevSlide} />
            <ChevronArrow direction="right" onClick={handleGotoNextSlide} />
          </>
        )}

        <Embla ref={emblaRef}>
          <EmblaContainer>
            {children.map(child => (
              <EmblaSlide key={child.key}>{child}</EmblaSlide>
            ))}
          </EmblaContainer>
        </Embla>
      </CarouselContainer>

      <Footer
        children={children}
        variant={variant}
        emblaApi={emblaApi}
        currentIndex={currentIndex}
      />
    </div>
  );
};

export default Carousel;
