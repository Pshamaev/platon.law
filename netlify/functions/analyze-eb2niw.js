// netlify/functions/analyze-eb2niw.js
// Netlify Serverless Function для анализа EB2-NIW кейсов

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { cvText, userInfo } = JSON.parse(event.body);
    
    if (!cvText || !userInfo?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'CV text and email required' })
      };
    }

    console.log(`Analyzing EB2-NIW for: ${userInfo.email}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `
You are an expert immigration attorney analyzing EB2-NIW (National Interest Waiver) cases.

Analyze this CV for EB2-NIW eligibility based on the Dhanasar 3-prong test:

PRONG 1: Proposed Endeavor
- Has substantial merit and national importance

PRONG 2: Well Positioned
- Applicant is well positioned to advance the proposed endeavor

PRONG 3: Balance
- It would be beneficial to the United States to waive the job offer requirement

Requirements:
- Advanced degree (Master's or higher) OR Bachelor's + 5 years progressive experience
- Exceptional ability in sciences, arts, or business

CV TEXT:
${cvText}

Return JSON with this structure (no markdown, pure JSON only):
{
  "overallScore": 72,
  "likelihood": "Medium",
  "hasAdvancedDegree": true,
  "prongs": [
    {
      "number": 1,
      "name": "Substantial Merit & National Importance",
      "score": 80,
      "strength": "Strong",
      "evidence": "AI research in healthcare has clear national importance",
      "details": "Work on medical diagnosis AI has potential to improve US healthcare outcomes."
    },
    {
      "number": 2,
      "name": "Well Positioned to Advance",
      "score": 75,
      "strength": "Good",
      "evidence": "PhD + 5 years experience + publications",
      "details": "Educational background and track record demonstrate capability to continue this work."
    },
    {
      "number": 3,
      "name": "Balance of Interests",
      "score": 65,
      "strength": "Good",
      "evidence": "Unique expertise in specialized AI field",
      "details": "Waiving job offer requirement would allow faster contribution to US innovation."
    }
  ],
  "qualifications": [
    {
      "criterion": "Advanced Degree",
      "score": 100,
      "evidence": "PhD in Computer Science, MIT"
    },
    {
      "criterion": "Publications",
      "score": 85,
      "evidence": "15 papers, 250 citations"
    },
    {
      "criterion": "Professional Recognition",
      "score": 70,
      "evidence": "Awards and citations from peers"
    }
  ],
  "recommendations": [
    "Clearly define your proposed endeavor (specific research or business plan)",
    "Demonstrate how your work benefits the US national interest",
    "Show you're uniquely qualified (not easily replaceable)",
    "Prepare detailed business/research plan for next 5 years"
  ],
  "estimatedApprovalChance": "65-75%",
  "typicalTimeline": "6-12 months"
}

Rules: Same as EB1A - realistic, conservative, JSON only.
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    // Clean markdown
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(responseText);
    
    const response = {
      success: true,
      caseType: 'EB2-NIW',
      analysis,
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
        country: userInfo.country,
        field: userInfo.field
      },
      generatedAt: new Date().toISOString()
    };

    console.log(`EB2-NIW analysis complete. Score: ${analysis.overallScore}`);

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
