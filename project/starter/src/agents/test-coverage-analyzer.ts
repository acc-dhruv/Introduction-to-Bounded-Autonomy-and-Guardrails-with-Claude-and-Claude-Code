import { TEST_COVERAGE_ANALYZER_PROMPT } from "../prompts/index";
import { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

export const testCoverageAnalyzer: AgentDefinition= {
  description: "Analyzes code for test coverage gaps, identifies untested paths, and suggests critical test cases to improve coverage.",
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  tools: ["Read"],
  model: "haiku",

};
