const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the web scraping API!');
});

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  try {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Navigate to the URL and scrape data
    await page.goto(url);
    const data = await page.evaluate((url) => {
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

      const getMetaContent = (name) => {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
      };

      const resolveUrl = (relativeUrl) => {
        if (!relativeUrl) return null;
        try {
          return new URL(relativeUrl, url).href;
        } catch {
          return relativeUrl;
        }
      };

      const logoLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
      const logo = logoLink ? resolveUrl(logoLink.getAttribute('href')) : null;

      const getFallbackDescription = () => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
        return Array.from(headings)
          .map((heading) => heading.textContent.trim())
          .filter((text) => text)
          .join(' | ') || null;
      };

      let image = null;
      if (isYouTube) {
        let videoId = null;
        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.hostname === 'youtu.be') {
            videoId = parsedUrl.pathname.substring(1);
          } else {
            videoId = parsedUrl.searchParams.get('v');
          }
          if (videoId) {
            image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        } catch (e) {
          console.error('Error parsing YouTube URL:', e);
        }
      } else {
        const imgElement = document.querySelector('img');
        image = imgElement ? resolveUrl(imgElement.src) : null;
      }

      return {
        title: document.title,
        description: getMetaContent('description') || getFallbackDescription(),
        keywords: getMetaContent('keywords'),
        logo,
        image,
      };
    }, url);

    res.status(200).json(data);
    await browser.close();
  } catch (error) {
    console.error('Error extracting webpage data:', error);
    res.status(500).json({ error: 'Failed to scrape the website' });
  }
});

// Export the app for Vercel serverless
module.exports = app;
