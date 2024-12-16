import { readFileSync } from "fs";

interface CSVRow {
  [key: string]: string;
}

export const loadCSV = (filename: string): CSVRow[] => {
  const fileContent = readFileSync(filename, "utf-8");
  const lines = fileContent.trim().split("\n");

  const headers = lines[0]
    .split(",")
    .map((header) => header.trim().replace(/^["']|["']$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line
      .split(",")
      .map((value) => value.trim().replace(/^["']|["']$/g, ""));

    return headers.reduce((row: CSVRow, header, index) => {
      row[header] = values[index];
      return row;
    }, {});
  });
};
