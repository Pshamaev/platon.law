// netlify/functions/analyze-eb1a.js
// FIXED VERSION with better error handling

const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'API key not configured. Please add GEMINI_API_KEY to Netlify environment variables.' 
        })
      };
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { cvText, userInfo } = requestData;
    
    if (!cvText || !userInfo?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'CV text and email required' })
      };
    }

    console.log(`Analyzing EB1A for: ${userInfo.email}`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
- Return ONLY valid JSON, no other text, no markdown, no backticks
`;

    // Call Gemini with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API timeout after 25 seconds')), 25000)
    );

    const resultPromise = model.generateContent(prompt);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    const responseText = result.response.text();
    console.log('Raw Gemini response:', responseText.substring(0, 200));
    
    // Clean the response (remove markdown if present)
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    let analysis;
    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Cleaned response:', cleanedResponse);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Failed to parse AI response. Please try again.' 
        })
      };
    }
    
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error analyzing CV:', error);
    
    // Better error messages
    let errorMessage = 'Failed to analyze CV';
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid or missing API key';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded - please try again later';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error.message 
      })
    };
  }
};
