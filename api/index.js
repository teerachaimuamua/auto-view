import chromium from '@sparticuz/chromium';
import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// Explicitly import the missing dependency
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';

// Initialize plugins
puppeteer.use(StealthPlugin());
puppeteer.use(UserPreferencesPlugin());

const app = express();

app.get('/', async (req, res) => {
    // Immediate response to prevent Vercel gateway timeouts
    res.json({ message: "Process started (Check Vercel Logs)" });

    const isProd = process.env.NODE_ENV === 'production';

    const CONFIG = {
        VIDEO_URL: 'https://www.youtube.com/shorts/LIRXmUBj1nM',
        HEADLESS: isProd ? chromium.headless : true
    };

    async function startViewer () {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({
            // Use core for production, standard for local dev
            args: isProd ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: isProd ? await chromium.executablePath() : undefined,
            headless: CONFIG.HEADLESS,
            defaultViewport: chromium.defaultViewport,
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

            await page.goto(CONFIG.VIDEO_URL, { waitUntil: 'networkidle2', timeout: 60000 });
            console.log("Page loaded successfully");

            // ... rest of your YouTube logic ...

        } catch (err) {
            console.error(`Error: ${err.message}`);
        } finally {
            if (browser) await browser.close();
            console.log("Browser closed");
        }
    }

    // Execute the logic
    startViewer();
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Local server running on http://localhost:${PORT}`);
    });
}

export default app;
