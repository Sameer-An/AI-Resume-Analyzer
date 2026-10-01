require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for in-memory PDF uploads (up to 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  }
});

// Helper function to call Gemini API
async function analyzeWithGemini(resumeText, jobDescription) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not configured in the .env file. Please add a valid API key.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert HR Analyst and Technical Recruiter.
Analyze the following resume against the job description carefully and objectively.

Resume Content:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""

Provide your assessment in strict JSON format matching this exact schema:
{
  "matchScore": <number between 0 and 100 representing percentage match>,
  "matchedSkills": [<array of skills present in both resume and job description>],
  "missingSkills": [<array of skills required by job description but missing in resume>],
  "resumeStrengths": [<array of strings describing key strengths of the resume for this role>],
  "weaknesses": [<array of strings describing key gaps, weaknesses, or concerns>],
  "improvementSuggestions": [<array of actionable suggestions to improve the resume for this position>],
  "recommendedSkills": [<array of relevant skills or certifications the candidate should learn>],
  "aiSummary": "<concise professional overview summarizing candidate fit>"
}

Important: Return ONLY valid JSON. Do not include markdown codeblocks or extra text.
`;

  // Try gemini-3.5-flash first, fallback to other available models
  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.7-flash'
  ];

  let lastError = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        let rawText = response.text || '';
        // Clean possible markdown code fences
        rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const parsedData = JSON.parse(rawText);
        return parsedData;
      } catch (err) {
        lastError = err;
        // If error is invalid API key or permission denied, stop cycling
        if (err.message && (err.message.includes('API key') || err.message.includes('permission'))) {
          throw err;
        }
        // Small delay before retrying or switching models
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  throw lastError || new Error('Failed to analyze with Gemini model.');
}

// API Route: Analyze Resume
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF resume.' });
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter a job description.' });
    }

    // Extract text from uploaded PDF
    let resumeText = '';
    try {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = (pdfData.text || '').trim();
    } catch (pdfErr) {
      return res.status(400).json({
        error: 'Failed to extract text from the PDF. Ensure the file is not password-protected or corrupted.'
      });
    }

    if (resumeText.length < 30) {
      return res.status(400).json({
        error: 'The uploaded PDF contains little to no readable text. Ensure it is a text-based PDF rather than a scanned image.'
      });
    }

    // Send to Gemini
    const analysis = await analyzeWithGemini(resumeText, jobDescription.trim());

    return res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during resume analysis.'
    });
  }
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'PDF file is too large. Maximum size allowed is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` AI Resume Analyzer running at:`);
  console.log(` http://localhost:${PORT}`);
  console.log(`===============================================`);
});
