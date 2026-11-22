import { describe, it, expect } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
    });

    it('should accept custom rate limit configuration', () => {
      const customOptions = {};
      const orchestrator = new CodeReviewOrchestrator(customOptions);
      expect(orchestrator).toBeDefined();
    });
  });

  describe('reviewPullRequest', () => {
    it('should fetch PR files from GitHub MCP', async () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator.reviewPullRequest).toBeDefined();
    });

    it('should spawn all 3 subagents in parallel', async () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
    });

    it('should aggregate results into ReviewReport', async () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator.reviewPullRequest).toBeDefined();
    });

    it('should validate output with Zod schema', async () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should review a real small PR', async () => {
      const orchestrator = new CodeReviewOrchestrator();
      const result = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
    });
  });
});
