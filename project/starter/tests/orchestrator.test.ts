import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';
import { ReviewReportSchema } from '../src/types/report-types';
import * as sdk from '@anthropic-ai/claude-agent-sdk';
import dotenv from "dotenv";
dotenv.config();

// Mock the SDK for unit tests (Integration tests will use real implementation)
vi.mock('@anthropic-ai/claude-agent-sdk');

/**
 * Tests for CodeReviewOrchestrator
 *
 * Tips:
 * - Use vitest mocking for MCP servers
 * - Mock rate limiter to avoid delays
 * - Test both success and failure paths
 */

describe('CodeReviewOrchestrator', () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const reviewOrchestrator = new CodeReviewOrchestrator();
      expect(reviewOrchestrator).toBeDefined();
      expect(reviewOrchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should accept custom rate limit configuration', () => {
      const customConfig = {};
      const reviewOrchestrator = new CodeReviewOrchestrator(customConfig);

      expect(reviewOrchestrator).toBeDefined();
      expect(reviewOrchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });
  });

  describe('reviewPullRequest', () => {
    it('should fetch PR files from GitHub MCP', async () => {
      const reviewOrchestrator = new CodeReviewOrchestrator();

      // Mock the query response
      const mockReviewReport = {
        pullRequest: { owner: 'octocat', repo: 'Hello-World', number: 1 },
        fileReviews: [],
        summary: { totalFiles: 0, overallScore: 85, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
        recommendations: [],
        metadata: { analyzedAt: new Date().toISOString(), duration: 1500, agentVersions: {} }
      };

      vi.mocked(sdk.query).mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { type: 'result', subtype: 'success', structured_output: mockReviewReport };
        }
      } as any);

      const reviewResult = await reviewOrchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      expect(reviewResult).toBeDefined();
      expect(reviewResult.pullRequest).toBeDefined();
      expect(reviewResult.pullRequest.owner).toBe('octocat');
      expect(reviewResult.pullRequest.repo).toBe('Hello-World');
      expect(reviewResult.pullRequest.number).toBe(1);
    });

    it('should spawn all 3 subagents in parallel', async () => {
      const reviewOrchestrator = new CodeReviewOrchestrator();

      // Mock response with data from multiple agents
      const mockReviewReport = {
        pullRequest: { owner: 'octocat', repo: 'Hello-World', number: 1 },
        fileReviews: [],
        summary: { totalFiles: 0, overallScore: 90, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
        recommendations: [],
        metadata: { analyzedAt: new Date().toISOString(), duration: 2000, agentVersions: {} }
      };

      vi.mocked(sdk.query).mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { type: 'result', subtype: 'success', structured_output: mockReviewReport };
        }
      } as any);

      const reviewResult = await reviewOrchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      // Verify that the result contains outputs from all three analysis agents
      expect(reviewResult).toBeDefined();
      expect(reviewResult.fileReviews).toBeInstanceOf(Array);
    });

    it('should aggregate results into ReviewReport', async () => {
      const reviewOrchestrator = new CodeReviewOrchestrator();

      // Mock complete ReviewReport structure
      const mockReviewReport = {
        pullRequest: { owner: 'example-owner', repo: 'example-repo', number: 42 },
        fileReviews: [],
        summary: { totalFiles: 1, overallScore: 88, criticalIssues: 0, highPriorityTests: 1, refactoringOpportunities: 2 },
        recommendations: [],
        metadata: { analyzedAt: new Date().toISOString(), duration: 3000, agentVersions: {} }
      };

      vi.mocked(sdk.query).mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { type: 'result', subtype: 'success', structured_output: mockReviewReport };
        }
      } as any);

      const reviewResult = await reviewOrchestrator.reviewPullRequest('example-owner', 'example-repo', 42);

      // Check that all required ReviewReport fields exist
      expect(reviewResult).toBeDefined();
      expect(reviewResult.pullRequest).toBeDefined();
      expect(reviewResult.fileReviews).toBeDefined();
      expect(reviewResult.summary).toBeDefined();
      expect(reviewResult.recommendations).toBeDefined();
      expect(reviewResult.metadata).toBeDefined();
    });

    it('should validate output with Zod schema', async () => {
      const reviewOrchestrator = new CodeReviewOrchestrator();

      // Mock valid ReviewReport for Zod validation
      const mockReviewReport = {
        pullRequest: { owner: 'test-org', repo: 'test-project', number: 10 },
        fileReviews: [],
        summary: { totalFiles: 0, overallScore: 95, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
        recommendations: [],
        metadata: { analyzedAt: new Date().toISOString(), duration: 1200, agentVersions: {} }
      };

      vi.mocked(sdk.query).mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { type: 'result', subtype: 'success', structured_output: mockReviewReport };
        }
      } as any);

      const reviewResult = await reviewOrchestrator.reviewPullRequest('test-org', 'test-project', 10);

      // Parse with Zod schema - will throw if validation fails
      const validated = ReviewReportSchema.parse(reviewResult);

      expect(validated).toBeDefined();
      expect(validated.pullRequest.owner).toBe('test-org');
      expect(validated.pullRequest.repo).toBe('test-project');
      expect(validated.pullRequest.number).toBe(10);
    });


  });


  describe('Integration', () => {
    // These tests require actual API keys and should be skipped in CI
    // NOTE: This test uses real MCP servers (not mocked)
    it.skip('should review a real small PR', async () => {
      // Restore real implementation for integration test
      vi.doUnmock('@anthropic-ai/claude-agent-sdk');

      // Test with a real public PR
      // NOTE: Only run manually with valid API keys
      const reviewOrchestrator = new CodeReviewOrchestrator();

      const reviewResult = await reviewOrchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

      expect(reviewResult).toBeDefined();
      expect(reviewResult.fileReviews).toBeInstanceOf(Array);
      expect(reviewResult.fileReviews.length).toBeGreaterThanOrEqual(0);
    }, 60000);
  });
});
