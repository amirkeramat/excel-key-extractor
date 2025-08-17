// Type for the Excel data structure
export interface ExcelData {
  [key: string]: any[];
}

// Type for the exported JSON structure with types included
export interface ExcelExportData {
  excelFile: {
    [fileName: string]: {
      [key: string]: string;
    };
  };
  excelNameType: {
    [key: string]: string;
  };
}
