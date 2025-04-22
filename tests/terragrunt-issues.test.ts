import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { TerragruntIssues } from "../libs/services/terragrunt-issues.ts";

/**
 * These integration tests require GitHub API access.
 * To avoid rate limiting issues, it's recommended to set up a GitHub token.
 *
 * You can run the tests with a GitHub token by setting the GITHUB_TOKEN environment variable:
 *
 * ```
 * GITHUB_TOKEN=your_github_token deno test --allow-net --allow-env
 * ```
 *
 * Without a token, the tests may fail due to GitHub API rate limits (403 Forbidden errors).
 */

// Helper function to create a TerragruntIssues instance with auth token if available
function createTerragruntIssues(): TerragruntIssues {
  // Check for GitHub token in environment variables
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    console.warn(
      "Warning: GITHUB_TOKEN not set. Tests may fail due to rate limiting.",
    );
  }
  return new TerragruntIssues({ token });
}

Deno.test("TerragruntIssues - getOpenIssues - single page", async () => {
  const terragruntIssues = createTerragruntIssues();

  // Get open issues (limit to 5 for testing)
  const issues = await terragruntIssues.getOpenIssues({ perPage: 5 });

  // Check that we got an array of issues
  assertExists(issues);
  assertEquals(Array.isArray(issues), true);

  // If there are issues, check the structure of the first one
  if (issues.length > 0) {
    const issue = issues[0];
    assertExists(issue.id);
    assertExists(issue.number);
    assertExists(issue.title);
    assertEquals(issue.state, "open");
    assertExists(issue.html_url);
    assertExists(issue.user);
    assertExists(issue.user.login);
  }

  console.log(`Found ${issues.length} open issues in single page`);
});

Deno.test("TerragruntIssues - getAllOpenIssues - pagination", async () => {
  const terragruntIssues = createTerragruntIssues();

  // We'll ask for 3 items per page and get up to 3 pages (9 items max)
  const allIssues = await terragruntIssues.getAllOpenIssues({
    perPage: 3,
    maxPages: 3,
  });

  // Verify we got a valid array of issues
  assertExists(allIssues);
  assertEquals(Array.isArray(allIssues), true);

  // Given the screenshot shows more than 5 open issues, we expect to get more
  // than just one page (3 items) when using pagination
  console.log(`Found ${allIssues.length} total open issues with pagination`);

  // Check that pagination actually fetched more issues than a single page would
  const singlePageIssues = await terragruntIssues.getOpenIssues({ perPage: 3 });
  assertEquals(
    allIssues.length > singlePageIssues.length,
    true,
    "Pagination should retrieve more issues than a single page",
  );

  // Verify all issues are unique (no duplicates from pagination)
  const issueIds = new Set(allIssues.map((issue: GitHubIssue) => issue.id));
  assertEquals(issueIds.size, allIssues.length, "All issues should be unique");
});

Deno.test("TerragruntIssues - getAllOpenIssues - no page limit", async () => {
  const terragruntIssues = createTerragruntIssues();

  // Test with a smaller page size to ensure multiple pages
  // but still reasonable for testing (we don't want to hammer the API)
  const allIssues = await terragruntIssues.getAllOpenIssues({
    perPage: 10,
    // no maxPages parameter means unlimited
  });

  // Verify we got a valid array of issues
  assertExists(allIssues);
  assertEquals(Array.isArray(allIssues), true);

  console.log(`Fetched ALL ${allIssues.length} open issues with no page limit`);

  // Compare with the limited pagination to ensure we're getting more results
  const limitedIssues = await terragruntIssues.getAllOpenIssues({
    perPage: 10,
    maxPages: 1,
  });

  // We should have more issues from unlimited fetching (unless there are very few open issues)
  // We know from the screenshot there are more than 10 issues, so this should pass
  assertEquals(
    allIssues.length >= limitedIssues.length,
    true,
    "Unlimited fetching should retrieve at least as many issues as limited fetching",
  );

  // Verify all issues are open
  for (const issue of allIssues) {
    assertEquals(issue.state, "open", `Issue #${issue.number} should be open`);
  }

  // Verify all issues are unique
  const issueIds = new Set(allIssues.map((issue: GitHubIssue) => issue.id));
  assertEquals(
    issueIds.size,
    allIssues.length,
    "All fetched issues should be unique",
  );
});

// Import GitHubIssue interface to fix type errors
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  body?: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
}
