import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { TerragruntDocs } from "../libs/services/terragrunt-docs.ts";

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

// Helper function to create a TerragruntDocs instance with auth token if available
function createTerragruntDocs(): TerragruntDocs {
  // Check for GitHub token in environment variables
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    console.warn("Warning: GITHUB_TOKEN not set. Tests may fail due to rate limiting.");
  }
  return new TerragruntDocs({ token });
}

Deno.test("TerragruntDocs - getDocCategories", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // Fetch all documentation categories
  const categories = await terragruntDocs.getDocCategories();
  
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
Deno.test("TerragruntDocs - listDocumentsInCategory", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // Test with a known category
  const documents = await terragruntDocs.listDocumentsInCategory("getting-started");
  
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

Deno.test("TerragruntDocs - listDocumentsInCategory - invalid category", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // Test with an invalid category name
  let error: Error | undefined;
  try {
    await terragruntDocs.listDocumentsInCategory("nonexistent-category");
  } catch (e) {
    error = e as Error;
  }
  
  // Verify we got an error
  assertExists(error, "Should throw an error for invalid category");
  assertEquals(error instanceof Error, true);
  assertEquals(error.message.includes("Category"), true,
    "Error message should mention the category");
});

Deno.test("TerragruntDocs - listDocumentsInCategory - features", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // Test with the Features category
  const documents = await terragruntDocs.listDocumentsInCategory("features");
  
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

Deno.test("TerragruntDocs - getDocumentFromCategory and listDocumentsInCategory integration", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // First, list all documents in the Getting Started category
  const documents = await terragruntDocs.listDocumentsInCategory("getting-started");
  
  // Verify we got some documents
  assertExists(documents);
  assertEquals(documents.length > 0, true, "Should find at least one document");
  
  // Then, try to fetch the first document using getDocumentFromCategory
  const firstDocName = documents[0].name;
  console.log(`Fetching document "${firstDocName}" from Getting Started category`);
  
  const document = await terragruntDocs.getDocumentFromCategory({
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

Deno.test("TerragruntDocs - getAllDocumentsByCategory", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // Test with a known category that should contain documents
  const categoryName = "getting-started";
  console.log(`Fetching all documents from "${categoryName}" category`);
  
  const mergedContent = await terragruntDocs.getAllDocumentsByCategory(categoryName);
  
  // Verify we got content
  assertExists(mergedContent);
  assertEquals(typeof mergedContent, "string", 
    "Merged content should be a string");
  
  // The content should be substantial if it contains multiple documents
  assertEquals(mergedContent.length > 1000, true, 
    "Merged content should contain substantial text (> 1000 chars)");
  
  // Verify content has expected structure
  // - Should start with a category header
  assertEquals(mergedContent.startsWith("# Getting Started Documentation"), true,
    "Merged content should start with a category header");
  
  // - Should contain at least one document header
  assertEquals(mergedContent.includes("## "), true,
    "Merged content should contain at least one document header");
  
  // - Should contain separator lines between documents
  assertEquals(mergedContent.includes("---"), true,
    "Merged content should contain separators between documents");
  
  console.log(`Successfully fetched merged content from ${categoryName} with ${mergedContent.length} characters`);
  
  // Get the list of documents in the category for verification
  const documents = await terragruntDocs.listDocumentsInCategory(categoryName);
  
  // Verify all document names appear in the merged content
  for (const doc of documents) {
    const docTitle = doc.name.replace('.md', '');
    // Create a safer regex pattern that escapes special characters
    const escapedTitle = docTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const docHeaderPattern = new RegExp(`## ${escapedTitle}([\\s\\n]|$)`);
    assertEquals(docHeaderPattern.test(mergedContent), true,
      `Merged content should contain document: ${docTitle}`);
  }
  
  console.log(`Verified all ${documents.length} documents appear in the merged content`);
});

// Test error handling for non-existent category
Deno.test("TerragruntDocs - getAllDocumentsByCategory - invalid category", async () => {
  const terragruntDocs = createTerragruntDocs();
  
  // Test with an invalid category name
  let error: Error | undefined;
  try {
    await terragruntDocs.getAllDocumentsByCategory("nonexistent-category");
  } catch (e) {
    error = e as Error;
  }
  
  // Verify we got an error
  assertExists(error, "Should throw an error for invalid category");
  assertEquals(error instanceof Error, true);
  assertEquals(error.message.includes("category"), true,
    "Error message should mention the category");
});
