import { friendli } from "@friendliai/ai-provider";
import { streamText } from "ai";
import { loadCSV } from "./csv";

const runModel = async (input: string) => {
  const start = new Date().getTime();

  let ttft = 0;
  // Receive second token
  let receiveSecondToken = 0;
  let resultText = "";

  const { textStream, usage } = streamText({
    model: friendli("meta-llama-3.1-8b-instruct"),
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
  }

  const end = new Date().getTime();

  const e2eTime = (end - start) / 1000; // Total end-to-end time
  const secondToken2eTime = (end - receiveSecondToken) / 1000; // Time from the second token to the end
  const ttop = (await usage).completionTokens / secondToken2eTime;

  return { ttop, e2eTime, ttft };
};

async function main() {
  try {
    const prompts = await loadCSV("data/prompt.csv");
    let MedianTTFT = 0;
    let MedianTTOP = 0;
    let MedianE2E = 0;

    const results = await Promise.all(
      prompts.slice(-10).map(({ prompt }) => runModel(prompt))
    );

    results.forEach(({ e2eTime, ttop, ttft }) => {
      MedianTTFT += ttft;
      MedianTTOP += ttop;
      MedianE2E += e2eTime;
    });

    const count = results.length;

    console.log(`Median TTFT: ${(MedianTTFT / count).toFixed(2)}s`);
    console.log(`Median TTOP: ${(MedianTTOP / count).toFixed(2)}T/s`);
    console.log(`Median E2E: ${(MedianE2E / count).toFixed(2)}s`);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
