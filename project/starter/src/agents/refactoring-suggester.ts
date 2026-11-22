import { REFACTORING_SUGGESTER_PROMPT } from "../prompts/index";
import { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { RefactoringSuggestionJSONSchema } from "../types";

export const refactoringSuggester: AgentDefinition= {
  description: "Identifies refactoring opportunities, suggests modernization improvements, and recommends code pattern enhancements to improve maintainability.",
  prompt: REFACTORING_SUGGESTER_PROMPT,
  tools: ["Read"],
  model: "haiku",
};
