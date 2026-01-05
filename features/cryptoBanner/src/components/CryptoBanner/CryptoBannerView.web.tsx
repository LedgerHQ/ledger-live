import { useEffect, useRef } from "react";
import { TopCrypto } from "../../data-layer/api/types";

interface CryptoBannerViewProps {
  topCryptos: TopCrypto[];
  isEnabled: boolean;
  autoScroll: boolean;
  scrollSpeed: number;
  isLoading: boolean;
  error: unknown;
  onToggleBanner: () => void;
  onToggleAutoScroll: () => void;
  onRefresh: () => void;
  className?: string;
}

export const CryptoBannerView = ({
  topCryptos,
  isEnabled,
  autoScroll,
  scrollSpeed,
  isLoading,
  error,
  className = "",
}: CryptoBannerViewProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;

    const element = scrollRef.current;
    let position = 0;

    const scroll = () => {
      position += 1;
      if (position >= element.scrollWidth / 2) {
        position = 0;
      }
      element.scrollLeft = position;
    };

    const interval = setInterval(scroll, scrollSpeed);
    return () => clearInterval(interval);
  }, [autoScroll, scrollSpeed]);

  if (!isEnabled) return null;

  if (isLoading) {
    return (
      <div className={`crypto-banner loading ${className}`}>
        <div className="banner-content">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`crypto-banner error ${className}`}>
        <div className="banner-content">Unable to load market data</div>
      </div>
    );
  }

  const cryptoItems = [...topCryptos, ...topCryptos];

  return (
    <div className={`crypto-banner ${className}`}>
      <div className="banner-scroll" ref={scrollRef}>
        <div className="banner-content">
          {cryptoItems.map((crypto, index) => (
            <div key={`${crypto.id}-${index}`} className="crypto-item">
              <span className="crypto-ticker">{crypto.ticker}</span>
              {crypto.price && (
                <span className="crypto-price">
                  $
                  {crypto.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              )}
              {crypto.priceChangePercentage24h !== undefined && (
                <span
                  className={`crypto-change ${crypto.priceChangePercentage24h >= 0 ? "positive" : "negative"}`}
                >
                  {crypto.priceChangePercentage24h >= 0 ? "+" : ""}
                  {crypto.priceChangePercentage24h.toFixed(2)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .crypto-banner {
          width: 100%;
          background: linear-gradient(90deg, blue 0%, #2a2a2a 100%);
          color: #ffffff;
          padding: 12px 0;
          overflow: hidden;
          border-bottom: 1px solid blue;
        }

        .banner-scroll {
          overflow-x: hidden;
          white-space: nowrap;
        }

        .banner-content {
          display: inline-flex;
          gap: 48px;
          padding: 0 24px;
        }

        .crypto-item {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-family: "Courier New", monospace;
        }

        .crypto-ticker {
          font-weight: bold;
          font-size: 14px;
          color: #60a5fa;
        }

        .crypto-price {
          font-size: 14px;
          color: #e5e5e5;
        }

        .crypto-change {
          font-size: 12px;
          font-weight: 600;
        }

        .crypto-change.positive {
          color: #10b981;
        }

        .crypto-change.negative {
          color: #ef4444;
        }

        .loading,
        .error {
          text-align: center;
          padding: 12px 24px;
        }

        .error {
          background: #ef4444;
        }
      `}</style>
    </div>
  );
};
