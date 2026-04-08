const RSSParser = require('rss-parser');
const aiOrchestrator = require('./ai_orchestrator'); // Memanggil file di atas
const parser = new RSSParser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
});

const JATENG_COORDS = {
    "Semarang": { lat: -6.99, lng: 110.42 }, "Demak": { lat: -6.89, lng: 110.63 },
    "Kudus": { lat: -6.80, lng: 110.84 }, "Pati": { lat: -6.75, lng: 111.03 },
    "Jepara": { lat: -6.58, lng: 110.67 }, "Rembang": { lat: -6.70, lng: 111.34 },
    "Blora": { lat: -6.96, lng: 111.41 }, "Grobogan": { lat: -7.02, lng: 110.91 }
};

const SOURCES = [
    { name: 'CNN Jateng', url: 'https://www.cnnindonesia.com/jateng/rss' },
    { name: 'Detik Jateng', url: 'https://www.detik.com/jateng/rss' },
    { name: 'Antara Jateng', url: 'https://jateng.antaranews.com/rss/nasional.xml' }
];

const detectLocation = (text) => {
    for (let kab in JATENG_COORDS) {
        if (text.toLowerCase().includes(kab.toLowerCase())) {
            return { name: kab, ...JATENG_COORDS[kab] };
        }
    }
    return { name: 'Jawa Tengah', lat: -7.15, lng: 110.14 };
};

const runScraper = async () => {
    console.log("[AI-BOT] Scanning News Feed...");
    for (const src of SOURCES) {
        try {
            const feed = await parser.parseURL(src.url);
            for (const item of feed.items) {
                const text = (item.title + " " + (item.contentSnippet || "")).toLowerCase();
                
                if (text.includes('banjir') || text.includes('gempa') || text.includes('longsor')) {
                    const loc = detectLocation(text);
                    const category = text.includes('banjir') ? 'Banjir' : text.includes('gempa') ? 'Gempa' : 'Longsor';
                    
                    // Kirim ke AI Orchestrator
                    await aiOrchestrator.processDeduplication({
                        title: item.title,
                        category: category,
                        source: src.name,
                        url: item.link,
                        lat: loc.lat,
                        lng: loc.lng,
                        region: loc.name
                    });
                }
            }
        } catch (e) {
            console.error(`[ERROR] Scraping ${src.name} failed.`);
        }
    }
    console.log("[AI-BOT] Sinkronisasi Selesai.");
};

module.exports = { runScraper };