import { useState } from "react";

export const TopCoinBanner = () => {
  const [topCoins, setTopCoins] = useState<string[]>([]);

  useEffect(() => {
    const fetchTopCoins = async () => {
      const res = await fetch("https://countervalues.live.ledger.com/v3/supported/crypto");
      const data = await res.json();
      setTopCoins(data.slice(0, 10));
    };
    fetchTopCoins();
  }, []);

  return (
    <div>
      <h1>Top Coin Banner</h1>
      {topCoins.map(coin => (
        <div key={coin}>
          <h2>{coin}</h2>
        </div>
      ))}
    </div>
  );
};
