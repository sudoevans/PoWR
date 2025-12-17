import axios from "axios";

export class CurrencyService {
    private ethPriceCache: { price: number; timestamp: number } | null = null;
    private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    // Fallback derived from user provided values:
    // $6 = 0.0020388849338298 ETH => 1 ETH = ~2942.78 USD
    private readonly FALLBACK_ETH_PRICE = 2942.78;

    async getEthPriceInUsd(): Promise<number> {
        try {
            if (
                this.ethPriceCache &&
                Date.now() - this.ethPriceCache.timestamp < this.CACHE_DURATION_MS
            ) {
                return this.ethPriceCache.price;
            }

            const response = await axios.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
            );

            if (response.data && response.data.ethereum && response.data.ethereum.usd) {
                const price = response.data.ethereum.usd;
                this.ethPriceCache = { price, timestamp: Date.now() };
                console.log(`Fetched live ETH price: $${price}`);
                return price;
            }

            console.warn("Invalid response from CoinGecko, using fallback price.");
            return this.FALLBACK_ETH_PRICE;
        } catch (error) {
            console.error("Failed to fetch ETH price:", error);
            return this.FALLBACK_ETH_PRICE;
        }
    }

    async convertUsdToEth(usdAmount: number): Promise<string> {
        const ethPrice = await this.getEthPriceInUsd();
        const ethAmount = usdAmount / ethPrice;
        // Return with high precision (18 decimals max, but standardizing to meaningful string)
        return ethAmount.toFixed(18);
    }
}

export const currencyService = new CurrencyService();
