# EB1A/EB2-NIW Assessment Tool - Netlify Serverless

AI-powered immigration case assessment tool built with **Netlify Functions** + **Google Gemini AI**.

## 🚀 Features

- **Serverless Architecture** - No backend to manage
- **Netlify Functions** - Auto-scaling serverless functions
- **Google Gemini AI** - Smart case analysis
- **100% Free Hosting** - Netlify free tier (125K requests/month)
- **Fast** - Global CDN, instant deployment
- **Secure** - Environment variables for API keys

---

## 📦 Project Structure

```
assessment-netlify-app/
├── netlify/
│   └── functions/
│       ├── analyze-eb1a.js       # EB1A analysis function
│       └── analyze-eb2niw.js     # EB2-NIW analysis function
├── public/
│   └── index.html                # Frontend (static HTML)
├── netlify.toml                  # Netlify configuration
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

---

## 🛠 Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Netlify account (free): https://netlify.com
- Google Gemini API key: https://makersuite.google.com/app/apikey

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Test Locally

```bash
npm run dev
# or
netlify dev
```

Open http://localhost:8888

Test the assessment tool:
1. Select EB1A or EB2-NIW
2. Paste sample CV
3. Fill in contact info
4. Click "Analyze My Chances"

---

## 🚀 Deploy to Netlify

### Option 1: Netlify CLI (Recommended)

```bash
# Login to Netlify
npx netlify login

# Initialize site
npx netlify init

# Deploy
npx netlify deploy --prod
```

### Option 2: GitHub + Netlify UI

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. Go to Netlify Dashboard: https://app.netlify.com
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub repo
5. Build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`

6. Add environment variables:
   - Go to Site Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your actual key

7. Deploy!

---

## 🔧 Configuration

### Netlify Functions

Functions are in `netlify/functions/`:

- `analyze-eb1a.js` - EB1A assessment endpoint
- `analyze-eb2niw.js` - EB2-NIW assessment endpoint

**Endpoints:**
- `/.netlify/functions/analyze-eb1a` (POST)
- `/.netlify/functions/analyze-eb2niw` (POST)

### Request Format

```javascript
POST /.netlify/functions/analyze-eb1a

{
  "cvText": "John Doe\nPhD Computer Science...",
  "userInfo": {
    "email": "john@example.com",
    "name": "John Doe",
    "country": "USA",
    "field": "Software Engineering"
  }
}
```

### Response Format

```javascript
{
  "success": true,
  "caseType": "EB1A",
  "analysis": {
    "overallScore": 78,
    "likelihood": "High",
    "criteriaScores": [...],
    "recommendations": [...]
  },
  "userInfo": {...},
  "generatedAt": "2026-01-18T..."
}
```

---

## 💰 Cost Breakdown

### Netlify Free Tier:
- **Bandwidth**: 100GB/month
- **Build minutes**: 300 min/month
- **Functions**: 125K requests/month
- **Forms**: 100 submissions/month

### For Assessment Tool:
- **Average request**: ~10-20KB
- **Function execution**: ~5-15 seconds
- **Cost**: $0 for first 125K assessments/month
- **After limit**: $25/month for extra 2M requests

### Google Gemini API:
- **Free tier**: 60 requests/minute
- **Cost after free tier**: 
  - Flash: $0.075 per 1M input tokens
  - Pro: $1.25 per 1M input tokens
- **Average CV analysis**: ~$0.001-0.003 per request

**Total**: Free for ~1000+ assessments/month

---

## 📊 Monitoring

### View Function Logs

```bash
netlify functions:logs analyze-eb1a
```

### Netlify Dashboard

- Functions tab: See invocations, errors, duration
- Analytics tab: Traffic, bandwidth usage
- Deploys tab: Build history

---

## 🔐 Security

### Environment Variables

Never commit `.env` file! Always use Netlify environment variables:

1. Site Settings → Environment Variables
2. Add `GEMINI_API_KEY`
3. Redeploy site

### CORS

Functions include CORS headers:
```javascript
'Access-Control-Allow-Origin': '*'
```

For production, restrict to your domain:
```javascript
'Access-Control-Allow-Origin': 'https://platon.law'
```

---

## 🎨 Customization

### Update Prompts

Edit prompts in function files:
- `netlify/functions/analyze-eb1a.js` (line ~40)
- `netlify/functions/analyze-eb2niw.js` (line ~40)

### Change Styling

Edit `public/index.html` CSS (line ~10)

### Add More Case Types

1. Create new function: `netlify/functions/analyze-o1.js`
2. Copy structure from `analyze-eb1a.js`
3. Update prompt for O-1 criteria
4. Add button in `index.html`

---

## 🐛 Troubleshooting

### Function Timeout

If analysis takes >10 seconds:
- Switch to Gemini Flash (faster)
- Reduce prompt size
- Increase function timeout in `netlify.toml`:

```toml
[functions]
  timeout = 30
```

### CORS Errors

Check function returns CORS headers:
```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

### API Key Not Working

1. Check Netlify environment variables
2. Redeploy after adding env vars
3. Test locally with `.env` file

---

## 🚀 Next Steps

### Add Database (Supabase)

```bash
npm install @supabase/supabase-js
```

In function:
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Save assessment
await supabase.from('assessments').insert({
  user_email: userInfo.email,
  case_type: 'EB1A',
  ai_score: analysis.overallScore,
  analysis: analysis
});
```

### Add Email Notifications

```bash
npm install @sendgrid/mail
```

In function:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: userInfo.email,
  from: 'assessments@platon.law',
  subject: 'Your EB1A Assessment Results',
  html: generateEmailHTML(analysis)
});
```

### Add PDF Generation

```bash
npm install pdfkit
```

---

## 📚 Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Google Gemini AI](https://ai.google.dev/docs)
- [Supabase Docs](https://supabase.com/docs)
- [SendGrid API](https://docs.sendgrid.com/)

---

## 📄 License

MIT License - Free to use and modify

---

## 👨‍💻 Author

**Platon Law LLC**  
Immigration Attorney specializing in EB1A/EB2-NIW cases

---

**Ready to deploy?**

```bash
netlify deploy --prod
```

Your assessment tool will be live at: `https://YOUR-SITE.netlify.app`

For custom domain: Site Settings → Domain Management → Add custom domain
