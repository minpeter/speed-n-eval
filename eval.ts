import { generateObject } from "ai";
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
      temperature: 1,
      prompt: `Question: ${question}\nChoices: ${choices.join(", ")}`,
    });

    const current = object === answer;
    console.log(`current: ${current}, object: ${object}, answer: ${answer}`);
    return current;
  } catch {
    console.log("current: false, object: error, answer: error");
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
      data.slice(-30).map(({ Question, A, B, C, D, Answer }) => {
        const choices = [A, B, C, D];
        const actualAnswer = choices["ABCD".indexOf(Answer)];

        return evalModel(Question, choices, actualAnswer);
      })
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

    console.log(`Accuracy: ${(correct / total) * 100}%`);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
