import type { RiskAssessment } from "@/types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export async function generateNepaliExplanation(
  assessment: RiskAssessment,
  householdName: string
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return getFallbackExplanation(assessment);
  }

  const factorsText =
    assessment.factors.length > 0
      ? assessment.factors.join(", ")
      : "कुनै विशेष लक्षण छैन";

  const prompt = `तपाईं एक मानसिक स्वास्थ्य सहायक हुनुहुन्छ जो नेपालमा काम गर्नुहुन्छ। 
  
  घरपरिवारको नाम: ${householdName}
  जोखिम स्कोर: ${assessment.score}/100
  जोखिम स्तर: ${assessment.level}
  पहिचान गरिएका लक्षणहरू: ${factorsText}
  
  कृपया यो परिवारको मानसिक स्वास्थ्य अवस्थाको बारेमा सरल नेपाली भाषामा 2-3 वाक्यमा व्याख्या गर्नुहोस्। 
  "यो परिवारलाई सहयोग चाहिन सक्छ किनभने..." बाट सुरु गर्नुहोस्।
  सरल र सम्मानजनक भाषा प्रयोग गर्नुहोस्। कुनै चिकित्सकीय शब्दजाल प्रयोग नगर्नुहोस्।`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No text in response");

    return text.trim();
  } catch (error) {
    console.error("Gemini API failed, using fallback:", error);
    return getFallbackExplanation(assessment);
  }
}

function getFallbackExplanation(assessment: RiskAssessment): string {
  const { level, factors, score } = assessment;

  if (level === "low") {
    return "यो परिवारको मानसिक स्वास्थ्य अहिले राम्रो अवस्थामा छ। नियमित अनुगमन जारी राख्नुहोस्।";
  }

  const factorText =
    factors.length > 0 ? factors.slice(0, 3).join(", ") : "केही लक्षणहरू";

  if (level === "medium") {
    return `यो परिवारलाई सहयोग चाहिन सक्छ किनभने ${factorText} जस्ता लक्षणहरू देखिएका छन् (जोखिम स्कोर: ${score}/100)। नियमित भेट गर्नुहोस् र परिवारसँग कुराकानी गर्नुहोस्।`;
  }

  if (level === "high") {
    return `यो परिवारलाई तत्काल सहयोग चाहिन्छ किनभने ${factorText} लगायतका गम्भीर लक्षणहरू देखिएका छन् (जोखिम स्कोर: ${score}/100)। स्वास्थ्य कार्यालयमा रिपोर्ट गर्नुहोस्।`;
  }

  return `यो परिवारलाई अत्यन्त तत्काल सहयोग चाहिन्छ किनभने ${factorText} लगायत अत्यन्त गम्भीर लक्षणहरू देखिएका छन् (जोखिम स्कोर: ${score}/100)। कृपया तुरुन्तै स्वास्थ्य अधिकारीलाई सूचित गर्नुहोस्।`;
}
