// index.js
import express from 'express';
const app = express();

app.get('/', (req, res) => {
    res.json({ message: "Hello from Express on Vercel!" });
});

// Vercel handles the "listen" part automatically in production, 
// but you keep this for local development.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export default app; // CRITICAL: Vercel needs this export
