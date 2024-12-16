import { loadCSV } from "./csv";

async function main() {
  try {
    const data = await loadCSV("data/mmlu.csv");
    console.log(data);
  } catch (error) {
    console.error("Error loading CSV:", error);
  }
}

main();
