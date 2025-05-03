const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = '3c2d78ae-41b3-41cb-82b1-89d19063591a';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await axios.post(API_URL, {
      model: 'deepseek-v3-241226',
      messages: [
        {
          role: 'system',
          content: '使用一个金句总结全文最核心的内容'
        },
        {
          role: 'user',
          content: text
        }
      ],
      stream: true,
      temperature: 0.6
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 60000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '请求失败' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});