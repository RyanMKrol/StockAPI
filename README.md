# StockAPI

This project is a consolidation of several other projects that I've built in this area!

This API should be able to return the following:

- Tickets in a given index
- Heatmap data for a given ticker/index
- Fundamentals data for a given ticker/index

## Previous Projects

### StockDataUpdater

This project was responsible for doing a daily fetch of the day-end prices for every stock I wanted to track. This data would later be used by another project to build up heatmaps comparing today's price to older prices.

https://github.com/RyanMKrol/StockDataUpdater

### StockPriceData-API

This API would be responsible for generating the previously mentioned heatmaps.

https://github.com/RyanMKrol/StockPriceData-API

### StockIndexTickers-API

This is quite a small API - it just returns the tickets present in a given index.

https://github.com/RyanMKrol/StockIndexTickers-API

### StockScreener

This tool will only be partially migrated. It does two things:

- Fetches the fundamentals data for stocks in a given index
- Let's the user run some processing to filter out stocks based on their own criteria

The second bit of functionality I will leave in this tool, but the first half can be migrated to this new API.

https://github.com/RyanMKrol/StockScreener
