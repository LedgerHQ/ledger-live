import React from "react";

type ProductTourSlideItemProps = {
  title: string;
  subtitle: string;
};

export function ProductTourSlideItem({ title, subtitle }: ProductTourSlideItemProps) {
  return (
    <div className="flex size-full flex-col">
      <div
        className="flex w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/10"
        style={{ height: 280, marginTop: -24 }}
      />

      <div
        className="flex flex-1 flex-col items-center px-20"
        style={{ gap: 30, paddingBottom: 8 }}
      >
        <div className="flex animate-fade-in flex-col items-center text-center">
          <div>
            <h3 className="m-0 mb-8 heading-4-semi-bold text-base">{title}</h3>
            <p className="m-0 body-2 text-muted">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
