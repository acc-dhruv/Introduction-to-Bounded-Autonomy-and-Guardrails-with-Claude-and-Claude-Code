import * as dotenv from 'dotenv';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils';
import * as fs from 'fs';
import * as path from 'path';
// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);
  if(!owner || !repo || !prStr){
    console.error("Error: owner, repo and prStr are mandtory.");
    process.exit(1);
  }
  // TODO: Validate command line arguments
  // - Check if owner, repo, and prStr are provided
  // - Convert prStr to number and validate it's a valid integer
  // - Exit with error message if validation fails

  const pr = Number.parseInt(prStr);
  if(isNaN(pr) || pr <= 0){
    console.error("Error: PR should be +ve integer > 0");
    process.exit(1);
  }

  // TODO: Validate authentication (choose ONE method)
  // Students must have either:
  //   - ANTHROPIC_API_KEY environment variable, OR
  //   - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for Bedrock
  //
  // If using AWS Bedrock:
  //   - Verify AWS_REGION is set
  //   - Log: "🔐 Using AWS Bedrock authentication"
  // If using Anthropic API:
  //   - Log: "🔐 Using Anthropic API authentication"
  // If neither method is configured:
  //   - Exit with clear error message showing both options
  const isAnthropicConfigured = process.env.ANTHROPIC_API_KEY
  const isAwsConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  if(isAnthropicConfigured){
    console.log("Using Anthropic API Config")
  }else if(isAwsConfigured){
     if(!process.env.AWS_REGION){
      console.error("Error: AWS Region not set");
      process.exit(1);
    }else{
      console.log("Using AWS Config")
    }
  }else{
    console.error("No Authentication is configured.\Either provide with anthropic api key or provide with AWS access key and secret access key");
    process.exit(1);
  }
 
  // TODO: Validate ANTHROPIC_MODEL environment variable
  // This is REQUIRED for both authentication methods
  // - For AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0
  // - For Anthropic API: claude-sonnet-4-5-20250929
  // Exit with error if not set

  if(isAnthropicConfigured && process.env.ANTHROPIC_MODEL !== "claude-sonnet-4-5-20250929"){
    console.error(`Error: For Anthropic config kindly set ANTHROPIC_MODEL as claude-sonnet-4-5-20250929`);
    process.exit(1);
  }else if(isAwsConfigured && process.env.ANTHROPIC_MODEL !== "us.anthropic.claude-sonnet-4-5-20250929-v1:0"){
    console.error(`Error: For AWS config kindly set ANTHROPIC_MODEL as "us.anthropic.claude-sonnet-4-5-20250929-v1:0`);
    process.exit(1);
  }

  console.log('start here', owner, repo, prStr)
  try {
    // TODO: Create orchestrator instance
    // TODO: Call .reviewPullRequest(owner, repo, prNumber);
    // TODO: Generate formatted reports using ReportGenerator
    // Hint: Use ReportGenerator to create Markdown, HTML, and JSON reports
    // Save reports to 'reports/' directory with appropriate filenames

    const orchestrator = new CodeReviewOrchestrator();
    const reportGen = new ReportGenerator();
    const result = await orchestrator.reviewPullRequest(owner,repo,pr);

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate and save reports
    const baseFileName = `${owner}-${repo}-${pr}`;

    const htmlReport = reportGen.generateHTMLReport(result);
    fs.writeFileSync(path.join(reportsDir, `${baseFileName}.html`), htmlReport);

    const jsonReport = reportGen.generateJSONReport(result);
    fs.writeFileSync(path.join(reportsDir, `${baseFileName}.json`), jsonReport);

    const mdReport = reportGen.generateMarkdownReport(result);
    fs.writeFileSync(path.join(reportsDir, `${baseFileName}.md`), mdReport);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
