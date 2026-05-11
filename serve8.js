import express from 'express';
const app = express();

// Original route
app.get('/', (req, res) => {
    res.json({ message: "Hello from Express on Vercel!" });
});

// New path to check deployment status
app.get('/status', (req, res) => {
    res.json({
        status: "Online",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        deployed_file: "serve8.js"
    });
});

// Vercel handles the "listen" part automatically in production
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export default app;
