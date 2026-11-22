import { AgentDefinition, query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReport, ReviewReportJSONSchema, ReviewReportSchema } from './types/report-types';
import dotenv from 'dotenv';
import { mcpServersConfig } from './config/mcp.config';
import { buildOrchestratorPrompt } from './prompts';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents';
dotenv.config();
/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  // agents : [AgentDefinition & {metadata? : any}]
  // allowedTools: string[]
  // outputFormat: any
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */

const subagents : Record<string,AgentDefinition> = {
  "code_quality_analyzer" : codeQualityAnalyzer,
  "test_coverage_analyzer" : testCoverageAnalyzer,
  "refactoring_suggestor" : refactoringSuggester
}
export class CodeReviewOrchestrator {
  // agents: [AgentDefinition & { metadata?: any; }];
  // allowedTools: string[];
  // outputFormat: any;

  constructor(options: OrchestratorOptions = {}) {
    // this.agents = options.agents;
    // this.allowedTools = options.allowedTools;
    // this.outputFormat = options.outputFormat;
  }

  /**
   * Review a pull request using parallel subagent analysis
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const result = await query({
      prompt: `${buildOrchestratorPrompt}\n\nReview the pull request: ${owner}/${repo}#${prNumber}`,
      options: {
        model: process.env.ANTHROPIC_MODEL,
        agents: subagents,
        allowedTools: [
        'Task',
        'mcp__github__*',
        'mcp__eslint__*'
        ],
        maxTurns: 20,
        outputFormat: {
        type: "json_schema",
        schema: ReviewReportJSONSchema,
        },
        mcpServers: mcpServersConfig
      },
      
      }
    );

      let res : any;
      for await(const response of result){
        if(response.type == 'result'){
            if (response.subtype === 'success' && response.structured_output) {
            res = response
        } else if (response.subtype === 'error_max_structured_output_retries') {
            throw new Error('Could not produce valid output')
        }
        }
      }

      const parsed = ReviewReportSchema.safeParse(res.structured_output);
      if(!parsed.success){
        throw new Error(`Invalid review report ${parsed.error.message}`)
      }

      return parsed.data;
  }
}
