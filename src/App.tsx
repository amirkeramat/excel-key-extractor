import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FileUpload from "./components/FileUpload";
import KeysList from "./components/KeysList";

interface ExcelData {
  [key: string]: any[];
}

// Function to extract keys from Excel formulas
function extractKeysFromFormula(formula: string): string[] {
  const keys: string[] = [];

  // Remove leading = sign if present
  const cleanFormula = formula.startsWith("=") ? formula.substring(1) : formula;

  // Patterns to extract various types of keys from formulas
  const patterns = [
    // Named ranges or keys in quotes
    /"([^"]+)"/g,
    /'([^']+)'/g,

    // Function arguments that look like keys
    /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,

    // Keys with underscores, hyphens, or dots
    /\b([A-Za-z][A-Za-z0-9_\-\.]*[A-Za-z0-9])\b/g,

    // Sheet references like 'SheetName'!A1
    /'([^'!]+)'!/g,

    // Named ranges or variables
    /\b([A-Z_][A-Z0-9_]*)\b/g,

    // camelCase identifiers
    /\b([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)\b/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(cleanFormula)) !== null) {
      const key = match[1];
      if (
        key &&
        key.length > 1 &&
        !isNumeric(key) &&
        !isExcelFunction(key) &&
        !isExcelCellReference(key)
      ) {
        keys.push(key);
      }
    }
  });

  // Also extract from Persian/Arabic text in formulas
  const persianPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
  let persianMatch;
  while ((persianMatch = persianPattern.exec(cleanFormula)) !== null) {
    if (persianMatch[0].length > 2) {
      keys.push(persianMatch[0]);
    }
  }

  return Array.from(new Set(keys)); // Remove duplicates
}

function isNumeric(str: string): boolean {
  return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

function isExcelFunction(str: string): boolean {
  const excelFunctions = [
    "SUM",
    "COUNT",
    "AVERAGE",
    "MAX",
    "MIN",
    "IF",
    "AND",
    "OR",
    "NOT",
    "VLOOKUP",
    "HLOOKUP",
    "INDEX",
    "MATCH",
    "CONCATENATE",
    "LEFT",
    "RIGHT",
    "MID",
    "LEN",
    "TRIM",
    "UPPER",
    "LOWER",
    "FIND",
    "SUBSTITUTE",
    "TEXT",
    "VALUE",
    "DATE",
    "TODAY",
    "NOW",
    "YEAR",
    "MONTH",
    "DAY",
    "WEEKDAY",
  ];
  return excelFunctions.includes(str.toUpperCase());
}

function isExcelCellReference(str: string): boolean {
  // Check if it's a cell reference like A1, B2, AA10, etc.
  return /^[A-Z]+[0-9]+$/i.test(str);
}

function isEnglishKey(str: string): boolean {
  // Only allow English characters, numbers, and common key symbols
  if (!str || typeof str !== "string") return false;

  const cleanStr = str.trim();

  // Must contain only English characters, numbers, and allowed symbols
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanStr)) return false;

  // Must be at least 2 characters long
  if (cleanStr.length < 2) return false;

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(cleanStr)) return false;

  // Exclude pure numbers
  if (/^\d+$/.test(cleanStr)) return false;

  // Exclude Excel functions
  if (isExcelFunction(cleanStr)) return false;

  // Exclude Excel cell references
  if (isExcelCellReference(cleanStr)) return false;

  // Check for meaningful patterns
  return (
    cleanStr.includes("_") || // snake_case
    cleanStr.includes("-") || // kebab-case
    cleanStr.includes(".") || // dot.notation
    /^[A-Z_][A-Z0-9_]*$/.test(cleanStr) || // CONSTANT_CASE
    /^[a-z]+[A-Z]/.test(cleanStr) || // camelCase
    /^[A-Za-z]+\d+$/.test(cleanStr) || // alphanumeric like key1, item2
    cleanStr.toLowerCase().includes("key") ||
    cleanStr.toLowerCase().includes("id") ||
    cleanStr.toLowerCase().includes("code") ||
    cleanStr.toLowerCase().includes("name") ||
    cleanStr.toLowerCase().includes("type") ||
    cleanStr.toLowerCase().includes("value")
  );
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedKeys, setExtractedKeys] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [excelData, setExcelData] = useState<ExcelData>({});
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setExtractedKeys([]);
    setExcelData({});
    setDebugInfo("");
  }, []);

  const extractKeys = useCallback(async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    console.log("Starting key extraction for file:", file.name);
    setIsProcessing(true);

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      console.log("File read successfully, size:", arrayBuffer.byteLength);

      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      console.log("Workbook parsed, sheets:", workbook.SheetNames);

      const allKeys = new Set<string>();
      const data: ExcelData = {};

      // Process each sheet
      workbook.SheetNames.forEach((sheetName) => {
        console.log(`Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row as first array element
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`Sheet ${sheetName} has ${jsonData.length} rows`);

        // Store sheet data
        data[sheetName] = jsonData as any[];

        // Extract formulas from all cells
        console.log(`Extracting formulas from sheet: ${sheetName}`);

        // Get the range of the worksheet
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
        console.log(`Sheet range: ${worksheet["!ref"]}`);

        let formulaCount = 0;
        let cellCount = 0;

        // Iterate through each cell in the range
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];

            if (cell) {
              cellCount++;
              console.log(`Cell ${cellAddress}:`, {
                value: cell.v,
                formula: cell.f,
                type: cell.t,
                raw: cell,
              });

              // Check for formulas first
              if (cell.f) {
                formulaCount++;
                const formula = cell.f;
                console.log(`Found formula in ${cellAddress}: ${formula}`);

                // Extract potential English keys from the formula
                const extractedKeys = extractKeysFromFormula(formula);
                extractedKeys.forEach((key) => {
                  if (isEnglishKey(key)) {
                    allKeys.add(key);
                    console.log(
                      `Added English key from formula in ${cellAddress}: ${key}`
                    );
                  } else {
                    console.log(
                      `Filtered non-English key from formula in ${cellAddress}: ${key}`
                    );
                  }
                });
              }

              // Check cell values for keys (only English patterns)
              if (cell.v !== undefined && cell.v !== null) {
                let cellValue = String(cell.v).trim();

                // Log all values for debugging
                console.log(`Cell ${cellAddress} value: ${cellValue}`);

                // Only add English keys that match specific patterns
                if (cellValue.length > 0 && isEnglishKey(cellValue)) {
                  allKeys.add(cellValue);
                  console.log(
                    `Added English key from ${cellAddress}: ${cellValue}`
                  );
                }
              }

              // Check if cell has any other properties that might contain English keys
              if (cell.w && isEnglishKey(cell.w)) {
                console.log(`Cell ${cellAddress} formatted text:`, cell.w);
                allKeys.add(cell.w);
              }
            }
          }
        }

        console.log(
          `Sheet ${sheetName} summary: ${cellCount} cells processed, ${formulaCount} formulas found`
        );

        // Also try to extract from the raw worksheet data
        console.log(
          `Raw worksheet keys for ${sheetName}:`,
          Object.keys(worksheet)
        );

        // Check if there are any named ranges or defined names
        if (workbook.Workbook && workbook.Workbook.Names) {
          console.log("Named ranges found:", workbook.Workbook.Names);
          workbook.Workbook.Names.forEach((name: any) => {
            if (name.Name) {
              allKeys.add(name.Name);
              console.log(`Added named range: ${name.Name}`);
            }
          });
        }

        // Extract English keys from headers as backup
        if (jsonData.length > 0) {
          const headers = jsonData[0] as any[];
          console.log(`Headers in ${sheetName}:`, headers);

          headers.forEach((header, index) => {
            if (header && typeof header === "string" && header.trim()) {
              const headerValue = header.trim();
              if (isEnglishKey(headerValue)) {
                allKeys.add(headerValue);
                console.log("Added English header key:", headerValue);
              } else {
                console.log("Filtered non-English header:", headerValue);
              }
            }
          });
        }
      });

      const keysArray = Array.from(allKeys).sort();
      console.log("Final extracted keys:", keysArray);
      console.log("Total keys found:", keysArray.length);

      // Set debug info
      const debugOutput = `
File: ${file.name}
File size: ${file.size} bytes
Sheets: ${workbook.SheetNames.join(", ")}
Total English keys found: ${keysArray.length}
Extraction mode: English Keys Only (Filtered)
Processing completed at: ${new Date().toLocaleTimeString()}

Keys preview: ${keysArray.slice(0, 10).join(", ")}${
        keysArray.length > 10 ? "..." : ""
      }
        `.trim();
      setDebugInfo(debugOutput);

      setExtractedKeys(keysArray);
      setExcelData(data);

      if (keysArray.length === 0) {
        alert(
          "No keys found in the Excel file. This might indicate:\n" +
            "1. The file is empty\n" +
            "2. The file format is not supported\n" +
            "3. The file is password protected\n" +
            "4. The formulas are stored in a different format\n\n" +
            "Please check the browser console (F12) for detailed debugging information."
        );
      } else {
        console.log(`SUCCESS: Found ${keysArray.length} keys!`);
      }
    } catch (error) {
      console.error("Error processing Excel file:", error);
      alert(
        `Error processing Excel file: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please make sure it's a valid Excel file and check the console for more details.`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const downloadJson = useCallback(() => {
    if (extractedKeys.length === 0) return;

    // Simple JSON with only the keys array
    const jsonData = {
      keys: extractedKeys,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const fileName = file?.name.replace(/\.[^/.]+$/, "") || "excel-keys";
    saveAs(blob, `${fileName}-keys.json`);
  }, [extractedKeys, file]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Excel Key Extractor
            </h1>
            <p className="text-gray-600 text-lg">
              Upload your Excel file to extract and download keys as JSON
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <FileUpload onFileSelect={handleFileSelect} />

            {file && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Selected File
                    </h3>
                    <p className="text-gray-600">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={extractKeys}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        "Extract Keys"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        console.log("Test button clicked");
                        console.log("File:", file);
                        console.log("File name:", file?.name);
                        console.log("File size:", file?.size);
                        console.log("File type:", file?.type);
                        setDebugInfo(
                          `Test clicked at: ${new Date().toLocaleTimeString()}\nFile: ${
                            file?.name || "No file"
                          }\nSize: ${file?.size || 0} bytes`
                        );
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Test
                    </button>
                  </div>
                </div>
              </div>
            )}

            {debugInfo && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Debug Information:
                </h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {debugInfo}
                </pre>
              </div>
            )}

            {extractedKeys.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Extracted Keys ({extractedKeys.length})
                  </h3>
                  <button
                    onClick={downloadJson}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download JSON
                  </button>
                </div>
                <KeysList keys={extractedKeys} />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              How to use:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>
                Upload your Excel file using the drag-and-drop area or click to
                browse
              </li>
              <li>
                Click "Extract Keys" to analyze the file and find all keys
              </li>
              <li>Review the extracted keys in the list below</li>
              <li>
                Click "Download JSON" to save the keys and data as a JSON file
              </li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The extractor now specifically extracts
                <strong> English keys only</strong> from Excel formulas and cell
                values. It filters out Persian/Arabic text and non-English
                content, focusing on: snake_case, camelCase, CONSTANT_CASE,
                kebab-case, dot.notation, and keys containing "id", "key",
                "code", "name", "type", or "value".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
