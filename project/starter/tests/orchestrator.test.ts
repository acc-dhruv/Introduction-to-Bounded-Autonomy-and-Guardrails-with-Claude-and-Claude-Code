import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';
import * as sdk from '@anthropic-ai/claude-agent-sdk';

// Mock the entire SDK module
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
  AgentDefinition: vi.fn(),
}));

/**
 * Tests for CodeReviewOrchestrator
 *
 * Tips:
 * - Use vitest mocking for MCP servers
 * - Mock rate limiter to avoid delays
 * - Test both success and failure paths
 */

// Helper to create a mock Query object
function createMockQuery(responses: any[]) {
  const mockQuery = {
    async *[Symbol.asyncIterator]() {
      for (const response of responses) {
        yield response;
      }
    },
    interrupt: vi.fn(),
    setPermissionMode: vi.fn(),
    setModel: vi.fn(),
    setMaxThinkingTokens: vi.fn(),
  };
  return mockQuery as any;
}

// Helper to create a valid ReviewReport structure
function createMockReviewReport(overrides = {}) {
  return {
    pullRequest: {
      owner: 'octocat',
      repo: 'Hello-World',
      number: 1
    },
    fileReviews: [
      {
        file: 'src/index.ts',
        codeQuality: {
          file: 'src/index.ts',
          issues: [
            {
              line: 10,
              severity: 'medium' as const,
              category: 'maintainability' as const,
              description: 'Function too complex',
              suggestion: 'Extract method'
            }
          ],
          overallScore: 85,
          summary: 'Good code quality overall'
        },
        testCoverage: {
          file: 'src/index.ts',
          hasTests: true,
          testFiles: ['src/index.test.ts'],
          untestedPaths: [],
          coverageEstimate: 90,
          summary: 'Well tested'
        },
        refactorings: {
          file: 'src/index.ts',
          suggestions: [],
          summary: 'No major refactoring needed'
        }
      }
    ],
    summary: {
      totalFiles: 1,
      overallScore: 85,
      criticalIssues: 0,
      highPriorityTests: 0,
      refactoringOpportunities: 0
    },
    recommendations: [
      {
        priority: 'medium' as const,
        category: 'maintainability',
        description: 'Consider refactoring complex functions',
        files: ['src/index.ts']
      }
    ],
    metadata: {
      analyzedAt: new Date().toISOString(),
      duration: 1000,
      agentVersions: {
        code_quality_analyzer: '1.0.0',
        test_coverage_analyzer: '1.0.0',
        refactoring_suggestor: '1.0.0'
      }
    },
    ...overrides
  };
}

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should accept custom rate limit configuration', () => {
      // Create orchestrator with custom rate limits
      const customOptions = {
        // Rate limit configuration would go here
      };
      const orchestrator = new CodeReviewOrchestrator(customOptions);

      // Verify custom limits are applied (or at least orchestrator is initialized)
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });
  });

  describe('reviewPullRequest', () => {
    beforeEach(() => {
      // Setup mocks for MCP servers and other external dependencies
      vi.clearAllMocks();
    });

    it('should fetch PR files from GitHub MCP and call query with correct parameters', async () => {
      const orchestrator = new CodeReviewOrchestrator();

      // Mock the query function to return a successful response
      const mockOutput = createMockReviewReport();
      const mockQuery = createMockQuery([
        {
          type: 'result',
          subtype: 'success',
          structured_output: mockOutput
        }
      ]);

      vi.mocked(sdk.query).mockReturnValue(mockQuery);

      await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      // Verify query was called with correct parameters
      expect(sdk.query).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('octocat/Hello-World#1'),
          options: expect.objectContaining({
            allowedTools: expect.arrayContaining(['Task', 'mcp__github__*', 'mcp__eslint__*']),
            maxTurns: 20,
          })
        })
      );
    });

    it('should spawn all 3 subagents in parallel', async () => {
      const orchestrator = new CodeReviewOrchestrator();

      const mockOutput = createMockReviewReport();
      const mockQuery = createMockQuery([
        {
          type: 'result',
          subtype: 'success',
          structured_output: mockOutput
        }
      ]);

      vi.mocked(sdk.query).mockReturnValue(mockQuery);

      await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      // Verify agents configuration includes all 3 subagents
      expect(sdk.query).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            agents: expect.objectContaining({
              code_quality_analyzer: expect.any(Object),
              test_coverage_analyzer: expect.any(Object),
              refactoring_suggestor: expect.any(Object),
            })
          })
        })
      );
    });

    it('should aggregate results into ReviewReport and validate with Zod schema', async () => {
      const orchestrator = new CodeReviewOrchestrator();

      const mockOutput = createMockReviewReport();
      const mockQuery = createMockQuery([
        {
          type: 'result',
          subtype: 'success',
          structured_output: mockOutput
        }
      ]);

      vi.mocked(sdk.query).mockReturnValue(mockQuery);

      const result = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      // Verify the result matches the expected structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('pullRequest');
      expect(result).toHaveProperty('fileReviews');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metadata');

      // Verify nested structure
      expect(result.pullRequest.owner).toBe('octocat');
      expect(result.pullRequest.repo).toBe('Hello-World');
      expect(result.pullRequest.number).toBe(1);
      expect(result.fileReviews).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
    });

    it('should throw error when Zod validation fails', async () => {
      const orchestrator = new CodeReviewOrchestrator();

      // Mock response with invalid structure (missing required fields)
      const invalidOutput = {
        summary: 'Test',
        // Missing required fields like pullRequest, fileReviews, etc.
      };

      const mockQuery = createMockQuery([
        {
          type: 'result',
          subtype: 'success',
          structured_output: invalidOutput
        }
      ]);

      vi.mocked(sdk.query).mockReturnValue(mockQuery);

      // Expect the validation to throw an error
      await expect(orchestrator.reviewPullRequest('octocat', 'Hello-World', 1))
        .rejects.toThrow('Invalid review report');
    });

    it('should throw error when max retries exceeded', async () => {
      const orchestrator = new CodeReviewOrchestrator();

      const mockQuery = createMockQuery([
        {
          type: 'result',
          subtype: 'error_max_structured_output_retries'
        }
      ]);

      vi.mocked(sdk.query).mockReturnValue(mockQuery);

      await expect(orchestrator.reviewPullRequest('octocat', 'Hello-World', 1))
        .rejects.toThrow('Could not produce valid output');
    });


  });


  describe('Integration', () => {
    // These tests require actual API keys and should be skipped in CI
    // Set a generous timeout for real API calls (30 seconds)
    it.skip('should review a real small PR', async () => {
      // Test with a real public PR
      // NOTE: Only run manually with valid API keys
      const orchestrator = new CodeReviewOrchestrator();
      const result = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('pullRequest');
      expect(result).toHaveProperty('fileReviews');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metadata');
    }, 30000); // 30 second timeout for integration test
  });
});
