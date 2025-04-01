import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { TerragruntRepo } from "../libs/services/terragrunt-repo.ts";

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

// Helper function to create a TerragruntRepo instance with auth token if available
function createTerragruntRepo(): TerragruntRepo {
  // Check for GitHub token in environment variables
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    console.warn("Warning: GITHUB_TOKEN not set. Tests may fail due to rate limiting.");
  }
  return new TerragruntRepo({ token });
}

Deno.test("TerragruntRepo - getOpenIssues - single page", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // Get open issues (limit to 5 for testing)
  const issues = await terragruntRepo.getOpenIssues({ perPage: 5 });
  
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

Deno.test("TerragruntRepo - getAllOpenIssues - pagination", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // We'll ask for 3 items per page and get up to 3 pages (9 items max)
  const allIssues = await terragruntRepo.getAllOpenIssues({ 
    perPage: 3,
    maxPages: 3 
  });
  
  // Verify we got a valid array of issues
  assertExists(allIssues);
  assertEquals(Array.isArray(allIssues), true);
  
  // Given the screenshot shows more than 5 open issues, we expect to get more 
  // than just one page (3 items) when using pagination
  console.log(`Found ${allIssues.length} total open issues with pagination`);
  
  // Check that pagination actually fetched more issues than a single page would
  const singlePageIssues = await terragruntRepo.getOpenIssues({ perPage: 3 });
  assertEquals(allIssues.length > singlePageIssues.length, true, 
    "Pagination should retrieve more issues than a single page");
  
  // Verify all issues are unique (no duplicates from pagination)
  const issueIds = new Set(allIssues.map(issue => issue.id));
  assertEquals(issueIds.size, allIssues.length, "All issues should be unique");
});

Deno.test("TerragruntRepo - fetchAllOpenIssues - no page limit", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // Test with a smaller page size to ensure multiple pages
  // but still reasonable for testing (we don't want to hammer the API)
  const allIssues = await terragruntRepo.fetchAllOpenIssues({ 
    perPage: 10 
  });
  
  // Verify we got a valid array of issues
  assertExists(allIssues);
  assertEquals(Array.isArray(allIssues), true);
  
  console.log(`Fetched ALL ${allIssues.length} open issues with no page limit`);
  
  // Compare with the limited pagination to ensure we're getting more results
  const limitedIssues = await terragruntRepo.getAllOpenIssues({ 
    perPage: 10,
    maxPages: 1 
  });
  
  // We should have more issues from unlimited fetching (unless there are very few open issues)
  // We know from the screenshot there are more than 10 issues, so this should pass
  assertEquals(allIssues.length >= limitedIssues.length, true, 
    "Unlimited fetching should retrieve at least as many issues as limited fetching");
  
  // Verify all issues are open
  for (const issue of allIssues) {
    assertEquals(issue.state, "open", `Issue #${issue.number} should be open`);
  }
  
  // Verify all issues are unique
  const issueIds = new Set(allIssues.map(issue => issue.id));
  assertEquals(issueIds.size, allIssues.length, "All fetched issues should be unique");
});

Deno.test("TerragruntRepo - getDocCategories", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // Fetch all documentation categories
  const categories = await terragruntRepo.getDocCategories();
  
  // Verify we got a valid array of categories
  assertExists(categories);
  assertEquals(Array.isArray(categories), true);
  
  // We should have at least 6 categories based on the GitHub repository structure
  // (01_getting-started, 02_features, 03_community, 04_reference, 05_troubleshooting, 06_migration_guides)
  console.log(`Found ${categories.length} documentation categories:`);
  
  // Use for...of instead of forEach to satisfy linter
  for (const category of categories) {
    console.log(`- ${category.name} (${category.path})`);
  }
  
  assertEquals(categories.length >= 6, true, 
    "Should find at least the 6 main documentation categories");
  
  // Check the structure of each category
  for (const category of categories) {
    assertExists(category.name);
    assertExists(category.path);
    assertExists(category.url);
    assertExists(category.html_url);
    
    // Verify the path matches the expected format (docs/_docs/*)
    assertEquals(category.path.startsWith("docs/_docs/"), true, 
      `Category path should start with "docs/_docs/": ${category.path}`);
    
    // Check that names are properly formatted (capitalized words without numbers)
    assertEquals(/^[A-Z][a-z]/.test(category.name), true, 
      "Category name should start with a capitalized letter");
    assertEquals(/^\d/.test(category.name), false, 
      "Category name should not start with a number");
  }
  
  // Verify specific expected categories exist
  const categoryNames = categories.map(c => c.name);
  const expectedCategories = [
    "Getting Started",
    "Features",
    "Community",
    "Reference",
    "Troubleshooting",
    "Migration Guides"
  ];
  
  for (const expected of expectedCategories) {
    assertEquals(
      categoryNames.some(name => name.includes(expected)), 
      true, 
      `Should find a category containing "${expected}"`
    );
  }
}); 

// Add tests for the new functions
Deno.test("TerragruntRepo - listDocumentsInCategory", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // Test with a known category
  const documents = await terragruntRepo.listDocumentsInCategory("getting-started");
  
  // Verify we got a valid array of documents
  assertExists(documents);
  assertEquals(Array.isArray(documents), true);
  
  console.log(`Found ${documents.length} documents in Getting Started category:`);
  for (const doc of documents) {
    console.log(`- ${doc.name} (${doc.path})`);
  }
  
  // We should have some documents in this category
  assertEquals(documents.length > 0, true, 
    "Should find at least one document in the Getting Started category");
  
  // Check the structure of each document
  for (const doc of documents) {
    assertExists(doc.name);
    assertExists(doc.path);
    assertExists(doc.html_url);
    assertExists(doc.download_url);
    assertExists(doc.sha);
    
    // Verify the extension is markdown
    assertEquals(doc.name.endsWith(".md"), true, 
      `Document should be a markdown file: ${doc.name}`);
    
    // Verify the path matches the expected format
    assertEquals(doc.path.startsWith("docs/_docs/"), true, 
      `Document path should start with "docs/_docs/": ${doc.path}`);
  }
});

Deno.test("TerragruntRepo - listDocumentsInCategory - invalid category", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // Test with an invalid category name
  let error: Error | undefined;
  try {
    await terragruntRepo.listDocumentsInCategory("nonexistent-category");
  } catch (e) {
    error = e as Error;
  }
  
  // Verify we got an error
  assertExists(error, "Should throw an error for invalid category");
  assertEquals(error instanceof Error, true);
  assertEquals(error.message.includes("Category"), true,
    "Error message should mention the category");
});

Deno.test("TerragruntRepo - listDocumentsInCategory - features", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // Test with the Features category
  const documents = await terragruntRepo.listDocumentsInCategory("features");
  
  // Verify we got documents
  assertExists(documents);
  assertEquals(Array.isArray(documents), true);
  
  console.log(`Found ${documents.length} documents in Features category:`);
  
  // We should have several documents in this category, including keep-your-terraform-code-dry.md
  assertEquals(documents.length > 0, true, 
    "Should find multiple documents in the Features category");
  
  // Check if we can find some expected document names
  const docNames = documents.map(doc => doc.name.toLowerCase());
  
  // We expect to find at least one of these common feature documents
  const expectedDocs = ["dry", "modules", "backend", "remote"];
  let foundExpectedDoc = false;
  
  for (const expectedDoc of expectedDocs) {
    if (docNames.some(name => name.includes(expectedDoc))) {
      foundExpectedDoc = true;
      break;
    }
  }
  
  assertEquals(foundExpectedDoc, true, 
    "Should find at least one of the expected feature documents");
});

Deno.test("TerragruntRepo - getDocumentFromCategory and listDocumentsInCategory integration", async () => {
  const terragruntRepo = createTerragruntRepo();
  
  // First, list all documents in the Getting Started category
  const documents = await terragruntRepo.listDocumentsInCategory("getting-started");
  
  // Verify we got some documents
  assertExists(documents);
  assertEquals(documents.length > 0, true, "Should find at least one document");
  
  // Then, try to fetch the first document using getDocumentFromCategory
  const firstDocName = documents[0].name;
  console.log(`Fetching document "${firstDocName}" from Getting Started category`);
  
  const document = await terragruntRepo.getDocumentFromCategory({
    category: "getting-started",
    document: firstDocName
  });
  
  // Verify we got the correct document
  assertExists(document);
  assertEquals(document.name, firstDocName, 
    "Document name should match what we requested");
  
  // Verify the document has content
  assertExists(document.content);
  assertEquals(document.content.length > 0, true, 
    "Document should have content");
  
  console.log(`Successfully fetched document "${document.name}" with ${document.content.length} characters of content`);
});
