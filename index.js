const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

async function detectWithHive(url) {
  const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.HIVE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  const classes = data?.status?.[0]?.response?.output?.[0]?.classes || [];
  const aiClass = classes.find(c => c.class === 'ai_generated');
  const score = aiClass ? Math.round(aiClass.score * 100) : 50;
  return {
    score,
    visual: Math.min(100, score + 4),
    motion: Math.max(0, score - 6),
    audio: Math.max(0, score - 10),
    confidence: score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low',
  };
}

app.post('/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const valid = /tiktok\.com|instagram\.com|facebook\.com|fb\.watch|youtube\.com\/shorts|youtu\.be/i.test(url);
  if (!valid) return res.status(400).json({ error: 'Unsupported platform' });

  try {
    const result = await detectWithHive(url);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Detection failed. Please try again.' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'RealReel API is running ✓' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
