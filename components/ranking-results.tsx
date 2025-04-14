import { CircleCheck, FileText, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { log } from "node:console";

interface RankingResult {
  fileName: string;
  score: number;
  matchedRequiredKeywords: string[];
  matchedOptionalKeywords: string[];
  missingRequiredKeywords: string[];
  strengths: string;
  weaknesses: string;
  overallAnalysis: string;
}

interface RankingResultsProps {
  results: RankingResult[];
  isLoading: boolean;
}

export default function RankingResults({
  results,
  isLoading,
}: RankingResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-600">Analyzing CVs...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FileText className="h-12 w-12 mb-4" />
        <p>Upload CVs and enter keywords to see results</p>
      </div>
    );
  }
  //! descemding order sorting
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  console.log("sorted results", sortedResults);

  return (
    <div className="space-y-4">
      {sortedResults.map((result, index) => {

        const allMatchedKeywords = [
          ...(result.matchedRequiredKeywords || []),
          ...(result.matchedOptionalKeywords || []),
        ];

        return (
          <div
            key={index}
            className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium truncate">{result.fileName}</h3>
              <span className="text-sm font-bold">
                {Math.round(result.score * 100)}%
              </span>
            </div>
            <Progress
              value={result.score * 100}
              className="h-2 mb-3"
            />

            {/* Matched Keywords */}
            {allMatchedKeywords.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Matched Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {allMatchedKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <CircleCheck className="h-3 w-3 mr-1" />
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {result.missingRequiredKeywords?.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">
                  Missing Required Keywords:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.missingRequiredKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
