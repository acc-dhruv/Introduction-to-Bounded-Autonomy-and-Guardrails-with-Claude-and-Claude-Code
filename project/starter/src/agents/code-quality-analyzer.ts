import { CODE_QUALITY_ANALYZER_PROMPT } from "../prompts/index";
import { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

export const codeQualityAnalyzer : AgentDefinition= {
    description: "Analyzes code for security vulnerabilities, performance issues, and maintainability concerns. Uses security and best practice skills to provide comprehensive quality assessment",
    prompt : CODE_QUALITY_ANALYZER_PROMPT,
    tools: ["Read","Skill"],
    model: "haiku",
}