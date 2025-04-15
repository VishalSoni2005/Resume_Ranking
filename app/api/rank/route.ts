// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/dev/null";

import dotenv from "dotenv";
dotenv.config();

if (!process.env.GOOGLE_API_KEY)
  throw new Error("Missing Google API key in environment variables");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    for (const entry of formData.entries()) {
      console.log(entry[0], entry[1]);
    }

    const files = formData.getAll("files") as File[]; //! here we extract { files } from request body

    console.log("File form frontend: ", files);

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
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str).join(" ");
    text += strings + "\n";
  }
  return text;
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
      You are an expert CV evaluator. Analyze the provided CV text and assess how well it matches the given required and optional keywords.

      Required Keywords:
      ${requiredKeywords.join(", ")}

      Optional Keywords:
      ${optionalKeywords.join(", ")}

      CV Text:
      ${cvText.substring(0, 30000)}

      Instructions:
      1. Analyze the CV text to identify which required and optional keywords are present.
      2. Highlight key strengths and weaknesses based on keyword presence and skill coverage.
      3. Provide an overall analysis based on the evaluation.

      Output Format:
      Return ONLY a valid JSON object with EXACTLY these fields:
      {
        "score": number (between 0 and 1),
        "matchedRequiredKeywords": string[],
        "matchedOptionalKeywords": string[],
        "missingRequiredKeywords": string[],
        "strengths": string,
        "weaknesses": string,
        "overallAnalysis": string
      }

      Ensure:
      - The JSON is valid and contains no extra text or formatting.
      - The score is a float between 0 and 1 indicating how well the CV matches the required criteria.
      - All array fields must only include keywords from the input lists.
      - Provide thoughtful insights in "strengths", "weaknesses", and "overallAnalysis".
      - Do not include markdown or commentary—return ONLY the raw JSON object.
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
