# 🚀 QUICK START - Deploy to Netlify in 5 Minutes

## Step 1: Get API Key (2 min)

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

---

## Step 2: Extract Files (30 sec)

```bash
tar -xzf assessment-netlify-app.tar.gz
cd assessment-netlify-app
```

---

## Step 3: Install & Deploy (2 min)

```bash
# Install dependencies
npm install

# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify init
# Answer prompts:
# - Team: Choose your team
# - Site name: eb1a-assessment (or whatever you want)
# - Build command: (leave empty, press Enter)
# - Publish directory: public

# Add your API key
netlify env:set GEMINI_API_KEY "YOUR_ACTUAL_KEY_HERE"

# Deploy to production
netlify deploy --prod
```

**Done!** 🎉

Your site is live at: `https://YOUR-SITE.netlify.app`

---

## Step 4: Test It (1 min)

1. Open your Netlify URL
2. Click "EB1A" or "EB2-NIW"
3. Paste sample CV:
   ```
   John Doe
   PhD Computer Science, MIT
   15 publications, 250 citations
   Best Paper Award 2023
   Senior Researcher at Google
   5 US Patents
   ```
4. Fill email: `test@example.com`
5. Click "Analyze My Chances"
6. Wait 10-20 seconds
7. See results! 🎯

---

## Step 5: Add to platon.law

### Option A: Subdomain
Point `assessment.platon.law` to Netlify site

### Option B: Embed via iframe
```html
<iframe src="https://YOUR-SITE.netlify.app" 
        width="100%" 
        height="800px" 
        frameborder="0">
</iframe>
```

### Option C: Custom domain
1. Netlify Dashboard → Domain Management
2. Add `platon.law/assessment`
3. Update DNS records

---

## 💰 Cost: $0/month

- First 125,000 assessments/month: FREE
- Gemini AI (first 1500 requests/day): FREE
- Total: **$0** until you hit serious scale

---

## 🐛 Common Issues

**"Function timeout"**
→ Increase timeout in `netlify.toml`:
```toml
[functions]
  timeout = 30
```

**"GEMINI_API_KEY not found"**
→ Set env variable:
```bash
netlify env:set GEMINI_API_KEY "your-key"
netlify deploy --prod
```

**"CORS error"**
→ Already handled in functions, should work

---

## 📊 Monitor Usage

```bash
# View function logs
netlify functions:log analyze-eb1a

# Or in Netlify Dashboard:
# Functions → analyze-eb1a → View logs
```

---

**Need help?** Check `README.md` for full documentation.

**Ready to scale?** Add Supabase database + email notifications (see README).
