"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/file-upload";
import RankingResults from "@/components/ranking-results";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function Home() {
  //* handle pdf
  const [files, setFiles] = useState<File[]>([]);
  //* requirement input
  const [requiredKeywords, setRequiredKeywords] = useState("");
  //* optional input
  const [optionalKeywords, setOptionalKeywords] = useState("");
  //* result text
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleFileChange = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleRankCVs = async () => {
    if (files.length === 0 || !requiredKeywords.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(); // created a from data to send tot server

      files.forEach((file) => {
        formData.append("files", file);
      });

      // console.log(files);

      // console.log(formData);
      formData.append("requiredKeywords", requiredKeywords);
      formData.append("optionalKeywords", optionalKeywords);

      const response = await fetch("/api/rank", {
        method: "POST",
        body: formData, // binary via a multipart/form-data HTTP request.
      });

      if (!response.ok) {
        throw new Error("Failed to rank CVs");
      }

      const data = await response.json();
      console.log("data from backend", data);
      setResults(data.results);
    } catch (error) {
      console.error("Error ranking CVs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-sky-200">
      <div className="container mx-auto py-8 px-4">
        {/* //! Header */}
        <Card className="mb-8">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="RankMyCV Logo"
                width={60}
                height={60}
                className="rounded-md"
              />
              <div>
                <h1 className="text-3xl font-bold">
                  Rank<span className="text-purple-500">MyCV</span>
                </h1>
                <p className="text-gray-700">Smart Resume Analysis Using AI</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
              onClick={logout}>
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* //todo: Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* //! card one : CV Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Upload CVs</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onFileChange={handleFileChange} />
            </CardContent>
          </Card>

          {/* //! card two : Keyword Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Enter Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Textarea
                  placeholder="Enter required keywords..."
                  className="resize-none h-32"
                  value={requiredKeywords}
                  onChange={(e) => setRequiredKeywords(e.target.value)}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Optional Keywords
                </h3>
                <Textarea
                  placeholder="Enter optional keywords..."
                  className="resize-none h-32"
                  value={optionalKeywords}
                  onChange={(e) => setOptionalKeywords(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3"
                onClick={handleRankCVs}
                disabled={
                  isLoading || files.length === 0 || !requiredKeywords.trim()
                }>
                {isLoading ? "RANKING..." : "RANK CVS"}
              </Button>
            </CardContent>
          </Card>

          {/* //! card three : Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingResults
                results={results}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
