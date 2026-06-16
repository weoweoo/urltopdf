import 'dotenv/config';
import express from 'express';
import { generatePdf } from './pdf.js'
import { validatePdfOptions } from './pdfOptions.js';
import rateLimit from 'express-rate-limit';
import cors from 'cors';


const app = express();
app.use(cors({
  origin: 'https://habsa.vercel.app', // lock to your actual domain
  methods: ['POST', 'GET'],
}));
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

const convertLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute rolling window
  max: 10,               // max 10 requests per IP per window
  standardHeaders: true, // return RateLimit-* headers in responses
  legacyHeaders: false,  // disable deprecated X-RateLimit-* headers

  // Custom handler so we return JSON (not HTML) and log the event
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded — IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

app.use(express.json());

function isValidUrl(string) {
  try {
    const { protocol } = new URL(string);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

app.get('/',(req, res) => {
    res.json({ status: 'ok', message: 'URL to PDF app running'});
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'URL to PDF API running' });
});

app.post('/api/convert', convertLimiter, async (req, res) => {
    const { url, suppressSelectors = [], ...optBody } = req.body;

    if (!url)
        return res.status(400).json({ error: 'Missing required field: url '});

    if (!isValidUrl(url))
        return res.status(400).json({ error: 'Invalid url, mist be http or https' });

    const {options, errors } = validatePdfOptions(optBody);

    if (errors.length > 0)
        return res.status(400).json({ error: 'Invalid PDF options', details: errors });

    try {
        const pdfBuffer = await generatePdf(url, {
          ...options,
        suppressSelectors
    });
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
        res.send(pdfBuffer);
    } catch (err){
        console.error('PDF generation failed', err.message);

    if (
      err.message.includes('TimeoutError') ||
      err.message.includes('Navigation timeout')
    ) {
      return res.status(400).json({
        error: 'The page took too long to load. Check the URL and try again.',
      });
    }

    if (err.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      return res.status(400).json({
        error: 'Could not resolve the domain. Check the URL.',
      });
    }

    if (err.message.includes('net::ERR_CONNECTION_REFUSED')) {
     return res.status(400).json({
        error: 'Connection refused. The target server may be down.',
      });
    }

    return res.status(500).json({
      error: 'PDF generation failed. Please try again.',
    });
  }
});

app.listen(PORT, () => {
    console.log(`server on http://localhost:${PORT}`);
});