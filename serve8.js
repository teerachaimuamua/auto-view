const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// ================= [ CONFIGURATION ] =================
const CONFIG = {
    VIDEO_URL: 'https://www.youtube.com/shorts/LIRXmUBj1nM',
    THREAD_COUNT: 10,    // จำนวนหน้าต่างที่เปิดพร้อมกันต่อ 1 รอบ
    TOTAL_ROUNDS: 10,   // จำนวนรอบทั้งหมดที่ต้องการรัน
    HEADLESS: true,    // true = รันเบื้องหลัง (ประหยัดแรม), false = เปิดหน้าจอโชว์
    WAIT_BETWEEN_ROUNDS: 5000 // เวลารอก่อนเริ่มรอบใหม่ (มิลลิวินาที)
};
// =====================================================

async function startViewer (threadId, round) {
    console.log(`[Round ${round} | Thread ${threadId}] กำลังเริ่มทำงาน...`);

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
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
        ];
        await page.setUserAgent(agents[threadId % agents.length]);

        await page.goto(CONFIG.VIDEO_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Focus & Play
        await page.waitForSelector('body');
        await page.click('body');

        // สุ่มเวลาดู 35-50 วินาที
        const watchTime = Math.floor(Math.random() * 15000) + 35000;
        console.log(`[R${round}-T${threadId}] รับชม ${watchTime / 1000}s...`);
        await new Promise(res => setTimeout(res, watchTime));

        // Smart Click Like (Evaluate)
        const result = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const likeBtn = buttons.find(b => {
                const label = (b.getAttribute('aria-label') || "").toLowerCase();
                return label.includes('like') || label.includes('ถูกใจ');
            });

            if (likeBtn && likeBtn.getAttribute('aria-pressed') === 'false') {
                likeBtn.click();
                return 'กด Like สำเร็จ';
            }
            return 'ข้าม (เคยกดแล้ว/หาไม่เจอ)';
        });

        console.log(`[R${round}-T${threadId}] ผลลัพธ์: ${result}`);

    } catch (err) {
        console.error(`[R${round}-T${threadId}] Error: ${err.message}`);
    } finally {
        await browser.close();
        console.log(`[R${round}-T${threadId}] ปิดหน้าต่าง`);
    }
}

async function main () {
    console.log(`=== เริ่มระบบปั่นวิวอัตโนมัติ ===`);
    console.log(`Config: ${CONFIG.THREAD_COUNT} Threads / ${CONFIG.TOTAL_ROUNDS} Rounds\n`);

    for (let r = 1; r <= CONFIG.TOTAL_ROUNDS; r++) {
        console.log(`>>> เริ่มการทำงานรอบที่ ${r} <<<`);

        const pool = [];
        for (let t = 1; t <= CONFIG.THREAD_COUNT; t++) {
            pool.push(startViewer(t, r));
        }

        // รอให้ทุก Thread ในรอบนั้นทำงานเสร็จก่อน
        await Promise.all(pool);

        if (r < CONFIG.TOTAL_ROUNDS) {
            console.log(`\nจบรองที่ ${r} รอพัก ${CONFIG.WAIT_BETWEEN_ROUNDS / 1000} วินาทีก่อนเริ่มรอบใหม่...\n`);
            await new Promise(res => setTimeout(res, CONFIG.WAIT_BETWEEN_ROUNDS));
        }
    }

    console.log('\n=== ทำงานครบทุกรอบตาม CONFIG แล้ว ===');
}

main();
