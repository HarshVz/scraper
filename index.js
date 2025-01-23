const puppeteer = require('puppeteer');
const express = require('express');

const app = express();
const PORT = 3000;
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the web scraping API!');
})

app.post('/scrape', async (req, res) => {

    const { url } = req.body;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      // Navigate to the URL
      await page.goto(url);

      // Extract data
      const data = await page.evaluate((url) => {
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

        // Helper function to get meta content
        const getMetaContent = (name) => {
          const meta = document.querySelector(`meta[name="${name}"]`);
          return meta ? meta.getAttribute('content') : null;
        };

        // Resolve relative URL to absolute
        const resolveUrl = (relativeUrl) => {
          if (!relativeUrl) return null;
          try {
            return new URL(relativeUrl, url).href;
          } catch {
            return relativeUrl; // Fallback in case of an error
          }
        };

        // Get logo
        const logoLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        const logo = logoLink ? resolveUrl(logoLink.getAttribute('href')) : null;

        // Get fallback description from heading tags
        const getFallbackDescription = () => {
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
          return Array.from(headings)
            .map((heading) => heading.textContent.trim())
            .filter((text) => text) // Filter out empty headings
            .join(' | ') || null; // Join heading texts as a fallback description
        };

        let image = null;

        if (isYouTube) {
          // Handle both full and shortened YouTube URLs
          let videoId = null;

          try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === 'youtu.be') {
              // Extract video ID from the pathname (e.g., /lE-VKc2R9L4)
              videoId = parsedUrl.pathname.substring(1);
            } else {
              // Extract video ID from the 'v' parameter in full URLs
              videoId = parsedUrl.searchParams.get('v');
            }

            if (videoId) {
              image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
          } catch (e) {
            console.error('Error parsing YouTube URL:', e);
          }
        } else {
          // Extract first image from the body for other sites
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

      res.send(data)
    } catch (error) {
      console.error('Error extracting webpage data:', error);
      return null;
    } finally {
      // Close the browser
      await browser.close();
    }
  }
);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
