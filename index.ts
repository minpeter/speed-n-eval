import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { readFileSync } from "fs";

interface CSVRow {
  [key: string]: string;
}

const loadCSV = (filename: string): CSVRow[] => {
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

const friendli = createOpenAI({
  apiKey: process.env.FRIENDLI_TOKEN,
  baseURL: "https://api.friendli.ai/serverless/v1",
});

const runModel = async (input: string) => {
  const start = new Date().getTime();

  let ttft = 0;
  // Receive second token
  let receiveSecondToken = 0;
  let totalChunkCound = 0;
  let resultText = "";

  const { textStream, usage } = streamText({
    model: friendli("meta-llama-3.1-70b-instruct"),
    prompt: input,
  });

  for await (const textPart of textStream) {
    if (ttft === 0) {
      // 첫번째 응답일 경우 ttft 기록으로 저장
      ttft = (new Date().getTime() - start) / 1000;
    } else if (receiveSecondToken === 0) {
      // 2번째 토큰부터 receiveSecondToken 타이머 시작
      receiveSecondToken = new Date().getTime();
    }

    resultText += textPart;
    totalChunkCound += textPart.split(/\s+/).length;
  }

  const end = new Date().getTime();

  const e2eTime = (end - start) / 1000; // Total end-to-end time
  const secondToken2eTime = (end - receiveSecondToken) / 1000; // Time from the second token to the end
  const ttop = totalChunkCound / secondToken2eTime;

  return { ttop, e2eTime, ttft };
};

const data = loadCSV("prompt.csv");

let MedianTTFT = 0;
let MedianTTOP = 0;
let MedianE2E = 0;

const promises = data.slice(-25).map(({ prompt }) => {
  return runModel(prompt);
});

Promise.all(promises).then((results) => {
  results.forEach(({ e2eTime, ttop, ttft }) => {
    MedianTTFT += ttft;
    MedianTTOP += ttop;
    MedianE2E += e2eTime;
  });

  const count = results.length;

  // ${ttop.toFixed(2)} T/s

  console.log(`Median TTFT: ${(MedianTTFT / count).toFixed(2)}s`);
  console.log(`Median TTOP: ${(MedianTTOP / count).toFixed(2)}T/s`);
  console.log(`Median E2E: ${(MedianE2E / count).toFixed(2)}s`);
});
