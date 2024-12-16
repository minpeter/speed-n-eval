import { createReadStream } from "fs";
import csv from "csv-parser";

export const loadCSV = (filename: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    createReadStream(filename)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        // console.log("CSV file successfully processed");
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
