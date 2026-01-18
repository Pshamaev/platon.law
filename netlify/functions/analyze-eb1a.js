// netlify/functions/analyze-eb1a.js
// Netlify Serverless Function для анализа EB1A кейсов

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only POST allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { cvText, userInfo } = JSON.parse(event.body);
    
    if (!cvText || !userInfo?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'CV text and email required' })
      };
    }

    console.log(`Analyzing EB1A for: ${userInfo.email}`);

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `
You are an expert immigration attorney analyzing EB1A (Extraordinary Ability) cases.

Analyze this CV for EB1A eligibility based on the 10 USCIS criteria:

1. Awards - nationally/internationally recognized prizes or awards
2. Membership - organizations requiring outstanding achievements
3. Published Material - press about the person's work
4. Judging - peer review, editorial boards, judging others' work
5. Original Contributions - major significance to the field
6. Scholarly Articles - authored publications in professional journals
7. Critical Employment - essential/critical capacity for distinguished organizations
8. High Remuneration - significantly high salary compared to others
9. Commercial Success - box office, album sales, exhibitions
10. Artistic Exhibition - displays at artistic exhibitions/showcases

CV TEXT:
${cvText}

Return a JSON object with this EXACT structure (no markdown, no backticks, pure JSON only):
{
  "overallScore": 78,
  "likelihood": "High",
  "criteriaScores": [
    {
      "name": "Publications",
      "score": 95,
      "strength": "Strong",
      "evidence": "15 peer-reviewed papers, 250+ citations, h-index: 12",
      "details": "Extensive publication record in top-tier venues demonstrates sustained excellence in research."
    },
    {
      "name": "Original Contributions",
      "score": 85,
      "strength": "Strong",
      "evidence": "5 US patents, novel algorithms in NLP",
      "details": "Patents and novel research demonstrate major contributions to the field."
    },
    {
      "name": "Awards",
      "score": 80,
      "strength": "Good",
      "evidence": "Best Paper Award 2023, Dean's Excellence Award",
      "details": "Awards from recognized institutions show peer recognition."
    },
    {
      "name": "Membership",
      "score": 30,
      "strength": "Weak",
      "evidence": "No selective professional organizations found",
      "details": "Need to join organizations requiring outstanding achievements (e.g., IEEE Senior Member)."
    },
    {
      "name": "Judging",
      "score": 20,
      "strength": "Very Weak",
      "evidence": "No peer review evidence",
      "details": "No documentation of reviewing papers, serving on editorial boards, or judging others' work."
    },
    {
      "name": "Media Coverage",
      "score": 0,
      "strength": "Missing",
      "evidence": "No published material about applicant",
      "details": "Need articles in professional or major media about the applicant's work."
    }
  ],
  "recommendations": [
    "Document any peer review activities (journal reviews, conference program committee service)",
    "Obtain membership in selective organizations (IEEE Senior Member, ACM Distinguished Member)",
    "Seek media coverage or press releases about your research contributions",
    "Prepare 3-4 strong recommendation letters from independent field leaders"
  ],
  "estimatedApprovalChance": "75-85%",
  "typicalTimeline": "4-6 months with premium processing"
}

IMPORTANT RULES:
- Score each criterion 0-100 based on evidence found
- Strength levels: "Strong" (80+), "Good" (60-79), "Weak" (30-59), "Very Weak" (10-29), "Missing" (0-9)
- Overall score is weighted average emphasizing strongest criteria
- Likelihood: "High" (70+), "Medium" (50-69), "Low" (<50)
- Be realistic and conservative - don't overestimate
- Only score based on actual evidence found in CV
- Return ONLY valid JSON, no other text
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the response (remove markdown if present)
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(cleanedResponse);
    
    // Add metadata
    const response = {
      success: true,
      caseType: 'EB1A',
      analysis,
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
        country: userInfo.country,
        field: userInfo.field
      },
      generatedAt: new Date().toISOString()
    };

    console.log(`Analysis complete. Score: ${analysis.overallScore}`);

    // TODO: Save to Supabase (optional)
    // await saveAssessment(response);

    // TODO: Send email with PDF report (optional)
    // await sendEmailReport(userInfo.email, analysis);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error analyzing CV:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to analyze CV',
        message: error.message 
      })
    };
  }
};
