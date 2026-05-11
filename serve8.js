import express from 'express';
// Use imports at the top level
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Initialize the plugin immediately
puppeteer.use(StealthPlugin());

const app = express();

app.get('/', async (req, res) => {
    // Send response early so Vercel doesn't timeout the HTTP request immediately
    // Note: Vercel Serverless Functions have a timeout (usually 10-60s)
    res.json({ message: "Process started (Check logs)" });

    // ================= [ CONFIGURATION ] =================
    const CONFIG = {
        VIDEO_URL: 'https://www.youtube.com/shorts/LIRXmUBj1nM',
        THREAD_COUNT: 1,
        TOTAL_ROUNDS: 1,
        HEADLESS: true,
        WAIT_BETWEEN_ROUNDS: 5000
    };
    // =====================================================

    async function startViewer (threadId, round) {
        console.log(`[Round ${round} | Thread ${threadId}] Starting...`);

        const browser = await puppeteer.launch({
            headless: CONFIG.HEADLESS,
            args: [
                '--window-size=500,700',
                '--mute-audio',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        try {
            const page = await browser.newPage();
            const agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            ];
            await page.setUserAgent(agents[threadId % agents.length]);
            await page.goto(CONFIG.VIDEO_URL, { waitUntil: 'networkidle2', timeout: 60000 });

            await page.waitForSelector('body');
            await page.click('body');

            const watchTime = Math.floor(Math.random() * 15000) + 35000;
            await new Promise(res => setTimeout(res, watchTime));

            const result = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const likeBtn = buttons.find(b => {
                    const label = (b.getAttribute('aria-label') || "").toLowerCase();
                    return label.includes('like') || label.includes('ถูกใจ');
                });

                if (likeBtn && likeBtn.getAttribute('aria-pressed') === 'false') {
                    likeBtn.click();
                    return 'Like Success';
                }
                return 'Skipped';
            });

            console.log(`[R${round}-T${threadId}] Result: ${result}`);

        } catch (err) {
            console.error(`[R${round}-T${threadId}] Error: ${err.message}`);
        } finally {
            await browser.close();
        }
    }

    // Call the main logic
    await main();

    async function main () {
        for (let r = 1; r <= CONFIG.TOTAL_ROUNDS; r++) {
            const pool = [];
            for (let t = 1; t <= CONFIG.THREAD_COUNT; t++) {
                pool.push(startViewer(t, r));
            }
            await Promise.all(pool);
            if (r < CONFIG.TOTAL_ROUNDS) {
                await new Promise(res => setTimeout(res, CONFIG.WAIT_BETWEEN_ROUNDS));
            }
        }
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: "Online",
        timestamp: new Date().toISOString()
    });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export default app;
