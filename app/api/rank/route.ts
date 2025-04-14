import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
dotenv.config();

if (!process.env.GOOGLE_API_KEY)
  throw new Error("Missing Google API key in environment variables");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const requiredKeywords = formData.get("requiredKeywords") as string;
    const optionalKeywords = (formData.get("optionalKeywords") as string) || "";

    if (!files.length || !requiredKeywords) {
      return NextResponse.json(
        { error: "Files and required keywords are required" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const fileContent = await extractTextFromFile(file);
        console.log("pdf text :", fileContent);
        
        const analysis = await analyzeCV(
          fileContent,
          requiredKeywords,
          optionalKeywords
        );

        return {
          fileName: file.name,
          ...analysis,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error processing CVs:", error);
    return NextResponse.json(
      { error: "Failed to process CVs" },
      { status: 500 }
    );
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer()); // ✅ Convert arrayBuffer to Node.js Buffer
  const data = await pdfParse(buffer); // ✅ Use pdf-parse to extract text
  return data.text;
}

async function analyzeCV(
  cvText: string,
  requiredKeywordsStr: string,
  optionalKeywordsStr: string
) {
  const requiredKeywords = requiredKeywordsStr
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const optionalKeywords = optionalKeywordsStr
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  try {
    const prompt = `
You are a professional CV analyzer. Analyze the following CV text for keyword matches and provide a comprehensive evaluation.

Required keywords: ${requiredKeywords.join(", ")}
Optional keywords: ${optionalKeywords.join(", ")}

CV Text:
${cvText.substring(0, 30000)}

Return your response as a valid JSON object with these exact fields:
{
  "score": 0.85,
  "matchedRequiredKeywords": ["React", "TypeScript"],
  "matchedOptionalKeywords": ["AWS", "Docker"],
  "missingRequiredKeywords": ["GraphQL"],
  "strengths": "Strong experience with modern frontend frameworks...",
  "weaknesses": "Limited experience with cloud infrastructure...",
  "overallAnalysis": "This candidate shows strong frontend skills but lacks..."
}

IMPORTANT: Only return valid JSON, no additional text or markdown.
    `.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonString = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing CV:", error);
    return {
      score: 0,
      matchedRequiredKeywords: [],
      matchedOptionalKeywords: [],
      missingRequiredKeywords: requiredKeywords,
      strengths: "",
      weaknesses: "Error analyzing CV",
      overallAnalysis:
        "Error analyzing CV: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// import { type NextRequest, NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from "dotenv";

// dotenv.config();
// if (!process.env.GOOGLE_API_KEY)
//   throw new Error("Missing Google API key in environment variables");

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const files = formData.getAll("files") as File[];
//     const requiredKeywords = formData.get("requiredKeywords") as string;
//     const optionalKeywords = (formData.get("optionalKeywords") as string) || "";

//     if (!files.length || !requiredKeywords) {
//       return NextResponse.json(
//         { error: "Files and required keywords are required" },
//         { status: 400 }
//       );
//     }

//     const results = await Promise.all(
//       files.map(async (file) => {
//         const fileContent = await extractTextFromFile(file);
//         const analysis = await analyzeCV(
//           fileContent,
//           requiredKeywords,
//           optionalKeywords
//         );

//         return {
//           fileName: file.name,
//           ...analysis,
//         };
//       })
//     );
//     console.log("results from backend", results);

//     return NextResponse.json({ results });
//   }

//   catch (error) {
//     console.error("Error processing CVs:", error);
//     return NextResponse.json(
//       { error: "Failed to process CVs" },
//       { status: 500 }
//     );
//   }
// }

// async function extractTextFromFile(file: File): Promise<string> {
//   const buffer = await file.arrayBuffer();
//   const text = new TextDecoder().decode(buffer);
//   console.log("pdf text :", text);

//   return text;
// }

// async function analyzeCV(
//   cvText: string,
//   requiredKeywordsStr: string,
//   optionalKeywordsStr: string
// ) {
//   const requiredKeywords = requiredKeywordsStr
//     .split(",")
//     .map((k) => k.trim())
//     .filter(Boolean);

//   const optionalKeywords = optionalKeywordsStr
//     .split(",")
//     .map((k) => k.trim())
//     .filter(Boolean);

//   try {

//     console.log("cv text", cvText);

//     const prompt = `
// You are a professional CV analyzer. Analyze the following CV text for keyword matches and provide a comprehensive evaluation.

// Required keywords: ${requiredKeywords.join(", ")}
// Optional keywords: ${optionalKeywords.join(", ")}

// CV Text:
// ${cvText.substring(0, 30000)}  # Gemini can handle larger context than GPT

// Return your response as a valid JSON object with these exact fields:
// {
//   "score": 0.85, // Score between 0-1 based on keyword matches and relevance
//   "matchedRequiredKeywords": ["React", "TypeScript"], // Array of matched required keywords
//   "matchedOptionalKeywords": ["AWS", "Docker"], // Array of matched optional keywords
//   "missingRequiredKeywords": ["GraphQL"], // Array of missing required keywords
//   "strengths": "Strong experience with modern frontend frameworks...", // Analysis of strengths
//   "weaknesses": "Limited experience with cloud infrastructure...", // Analysis of weaknesses
//   "overallAnalysis": "This candidate shows strong frontend skills but lacks..." // Overall analysis
// }

// IMPORTANT: Only return valid JSON, no additional text or markdown.
//     `.trim();

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     const jsonString = text
//       .replace(/```json/g, "")
//       .replace(/```/g, "")
//       .trim();
//     return JSON.parse(jsonString);
//   } catch (error) {
//     console.error("Error analyzing CV:", error);
//     return {
//       score: 0,
//       matchedRequiredKeywords: [],
//       matchedOptionalKeywords: [],
//       missingRequiredKeywords: requiredKeywords,
//       strengths: "",
//       weaknesses: "Error analyzing CV",
//       overallAnalysis:
//         "Error analyzing CV: " +
//         (error instanceof Error ? error.message : String(error)),
//     };
//   }
// }
