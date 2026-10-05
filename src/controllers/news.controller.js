const pool = require('../db/pool');

async function getNews(req, res) {
  try {
    const { symbol } = req.params;

    if (symbol.endsWith('.NS')) {
      const bare = symbol.replace('.NS', '');

      const stockData = await pool.query('SELECT company_name FROM stocks WHERE symbol=$1', [symbol]);
      const companyName = stockData.rows[0]?.company_name || '';

      const query = companyName ? `${bare} "${companyName}"` : `${bare} NSE stock`;

      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWSAPI_API_KEY}`
      );
      const newsData = await newsRes.json();

      const seen = new Set();
      const bareLower = bare.toLowerCase();
      const nameFirstWord = companyName.split(' ')[0].toLowerCase();

      const articles = (newsData.articles || [])
        .filter(a => {
          const t = (a.title || '').toLowerCase();
          const d = (a.description || '').toLowerCase();
          return t.includes(bareLower) || d.includes(bareLower) ||
            t.includes(nameFirstWord) || d.includes(nameFirstWord);
        })
        .filter(a => {
          const key = `${(a.publishedAt || '').slice(0, 10)}-${(a.title || '').toLowerCase().slice(0, 50)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(a => ({
          title: a.title,
          description: a.description,
          url: a.url,
          image: a.urlToImage,
          publishedAt: a.publishedAt,
          source: a.source?.name
        }));

      res.json({ news: articles });

    } else {
      const toDate = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const newsRes = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`
      );
      const newsData = await newsRes.json();

      const articles = (newsData || []).slice(0, 10).map(a => ({
        title: a.headline,
        description: a.summary,
        url: a.url,
        image: a.image,
        publishedAt: new Date(a.datetime * 1000).toISOString(),
        source: a.source
      }));

      res.json({ news: articles });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { getNews };
