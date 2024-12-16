import { generateObject, generateText } from "ai";
import { loadCSV } from "./csv";
import { friendli } from "@friendliai/ai-provider";

const evalModel = async (
  question: string,
  choices: string[],
  answer: string
) => {
  const longest = choices.reduce((prev, curr) =>
    prev.length > curr.length ? prev : curr
  );

  try {
    const { object } = await generateObject({
      model: friendli("meta-llama-3.1-70b-instruct"),
      maxTokens: longest.length + 50,
      output: "enum",
      enum: choices,
      prompt: question,
    });

    return object === answer;
  } catch {
    return false;
  }
};

async function main() {
  try {
    const data = await loadCSV("data/mmlu.csv");
    let correct = 0;
    let wrong = 0;
    let total = 0;

    const results = await Promise.all(
      data
        .slice(-5)
        .map(({ Question, A, B, C, D, Answer }) =>
          evalModel(Question, [A, B, C, D], Answer)
        )
    );

    results.forEach((result) => {
      if (result) {
        correct++;
      } else {
        wrong++;
      }
      total++;
    });

    console.log(`Correct: ${correct}`);
    console.log(`Wrong: ${wrong}`);
    console.log(`Total: ${total}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
