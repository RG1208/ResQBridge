// src/pages/predict.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { analyzeImage } from "@/api";

interface Detection {
  class: string;
  confidence: number;
  severity?: string;
}

interface AnalyzeResult {
  success: boolean;
  accidentDetected: boolean;
  detection?: Detection;
  processedImage?: string;
}

export default function Predict() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a preview URL when an image is selected.
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setResult(null);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject("Error reading file");
      reader.readAsDataURL(file);
    });

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please select an image to analyze.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await convertFileToBase64(imageFile);
      const response = await analyzeImage(base64);
      const simplifiedResult: AnalyzeResult = {
        success: response.success,
        accidentDetected: response.accidentDetected,
        detection: response.detection, // Expected: { class, confidence, severity }
        processedImage: response.processedImage,
      };
      setResult(simplifiedResult);
    } catch (err: any) {
      setError(err.message || "Error analyzing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-10">
          Predict Accident
        </h1>
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-8">
          <div className="flex flex-col items-center space-y-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-center py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-md rounded-xl shadow-lg border border-gray-200"
              />
            )}
            <Button
              onClick={handleAnalyze}
              disabled={loading || !imageFile}
              className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition duration-300"
            >
              {loading ? "Analyzing..." : "Analyze Image"}
            </Button>
            {error && (
              <Alert variant="destructive" className="w-full max-w-md text-center">
                <p>{error}</p>
              </Alert>
            )}
            {result && (
              <div className="w-full max-w-md mt-8 p-6 bg-gray-100 rounded-xl shadow-inner border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Summary</h2>
                <p className="text-lg mb-2">
                  <span className="font-semibold">Accident Detected:</span>{" "}
                  {result.accidentDetected ? "Yes" : "No"}
                </p>
                {result.accidentDetected && result.detection && (
                  <div className="space-y-2 text-base text-gray-700">
                    <p>
                      <span className="font-semibold">Type:</span>{" "}
                      {result.detection.class}
                    </p>
                    <p>
                      <span className="font-semibold">Confidence:</span>{" "}
                      {(result.detection.confidence * 100).toFixed(1)}%
                    </p>
                    <p>
                      <span className="font-semibold">Severity:</span>{" "}
                      {result.detection.severity || "N/A"}
                    </p>
                  </div>
                )}
                {result.processedImage && (
                  <div className="mt-6">
                    <p className="font-semibold text-gray-800 mb-2">
                      Annotated Image:
                    </p>
                    <img
                      src={result.processedImage}
                      alt="Annotated"
                      className="w-full rounded-xl shadow-md"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
