import { HttpClient } from "../adapters/http-client.ts";

// Define types for GitHub API responses
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

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir" | "symlink" | "submodule";
  url: string;
  html_url: string;
  download_url: string | null;
}

/**
 * Represents a documentation category from the Terragrunt repository
 */
interface DocCategory {
  name: string;
  path: string;
  url: string;
  html_url: string;
}

/**
 * Represents a documentation file from the Terragrunt repository
 */
interface DocFile {
  name: string;
  path: string;
  content: string;
  html_url: string;
  download_url: string;
  size: number;
  sha: string;
}

/**
 * Represents a documentation file summary without the full content
 */
interface DocFileSummary {
  name: string;
  path: string;
  html_url: string;
  download_url: string;
  size: number;
  sha: string;
}

export class TerragruntRepo {
  private client: HttpClient;
  private readonly owner: string;
  private readonly repo: string;

  constructor(options: {
    owner?: string;
    repo?: string;
    apiBaseUrl?: string;
    token?: string;
  } = {}) {
    this.owner = options.owner || "gruntwork-io";
    this.repo = options.repo || "terragrunt";
    const apiBaseUrl = options.apiBaseUrl || "https://api.github.com";

    const headers: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Add authorization if token is provided
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    this.client = new HttpClient(apiBaseUrl, {
      headers,
    });
  }

  /**
   * Get a single page of open issues from the Terragrunt repository
   * @param options Optional parameters to filter issues
   * @returns Promise with an array of issues for the requested page
   */
  async getOpenIssues(options: {
    perPage?: number;
    page?: number;
  } = {}): Promise<GitHubIssue[]> {
    const queryParams: Record<string, string> = {
      state: "open",
      per_page: String(options.perPage || 30),
      page: String(options.page || 1),
    };

    const response = await this.client.get<GitHubIssue[]>(
      `repos/${this.owner}/${this.repo}/issues`,
      { queryParams }
    );

    return response as GitHubIssue[];
  }

  /**
   * Get all open issues from the Terragrunt repository by automatically handling pagination
   * with a configurable page limit
   * @param options Optional parameters to customize the request
   * @returns Promise with an array of all open issues
   */
  async getAllOpenIssues(options: {
    perPage?: number;
    maxPages?: number; // Limit the number of pages to fetch (for testing/limiting)
  } = {}): Promise<GitHubIssue[]> {
    const perPage = options.perPage || 30;
    const maxPages = options.maxPages || 10; // Reasonable default limit
    
    let currentPage = 1;
    let hasMorePages = true;
    const allIssues: GitHubIssue[] = [];
    
    while (hasMorePages && currentPage <= maxPages) {
      const pageIssues = await this.getOpenIssues({
        perPage,
        page: currentPage,
      });
      
      // Add current page results to the collection
      allIssues.push(...pageIssues);
      
      // Check if we've reached the end
      if (pageIssues.length < perPage) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    }
    
    return allIssues;
  }

  /**
   * Get absolutely ALL open issues from the Terragrunt repository without any page limit
   * @param options Optional parameters to customize the request
   * @returns Promise with an array of all open issues
   */
  async fetchAllOpenIssues(options: {
    perPage?: number;
  } = {}): Promise<GitHubIssue[]> {
    const perPage = options.perPage || 100; // Use max page size for efficiency
    
    let currentPage = 1;
    let hasMorePages = true;
    const allIssues: GitHubIssue[] = [];
    
    while (hasMorePages) {
      const pageIssues = await this.getOpenIssues({
        perPage,
        page: currentPage,
      });
      
      // Add current page results to the collection
      allIssues.push(...pageIssues);
      
      // Check if we've reached the end (last page)
      if (pageIssues.length < perPage) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    }
    
    return allIssues;
  }

  /**
   * Get all documentation categories from the Terragrunt repository
   * Categories are represented as folders in the docs/_docs path
   * @returns Promise with an array of documentation categories
   */
  async getDocCategories(): Promise<DocCategory[]> {
    // The docs are stored in the 'docs/_docs' directory of the repo
    const path = "docs/_docs";
    
    try {
      const response = await this.client.get<GitHubContent[]>(
        `repos/${this.owner}/${this.repo}/contents/${path}`,
        {}
      );
      
      const contents = response as GitHubContent[];
      
      // Filter to include only directories (these are our categories)
      const categories = contents
        .filter(item => item.type === "dir")
        .map(dir => ({
          name: this.formatCategoryName(dir.name),
          path: dir.path,
          url: dir.url,
          html_url: dir.html_url,
        }));
      
      return categories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch documentation categories: ${errorMessage}`);
    }
  }

  /**
   * List all markdown documents in a specific category
   * @param category The category name to list documents from
   * @returns Promise with an array of document summaries
   */
  async listDocumentsInCategory(category: string): Promise<DocFileSummary[]> {
    try {
      // First, get all categories to find the matching one
      const categories = await this.getDocCategories();
      
      // Find the category that matches the requested one (case-insensitive)
      const categoryName = category.toLowerCase();
      const matchedCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(categoryName) || 
        cat.path.toLowerCase().includes(categoryName)
      );
      
      if (!matchedCategory) {
        throw new Error(`Category "${category}" not found`);
      }
      
      // Get all files in the category
      const response = await this.client.get<GitHubContent[]>(
        `repos/${this.owner}/${this.repo}/contents/${matchedCategory.path}`,
        {}
      );
      
      const contents = response as GitHubContent[];
      
      // Find and return only markdown files
      const mdFiles = contents
        .filter(item => item.type === "file" && item.name.endsWith(".md"))
        .map(file => ({
          name: file.name,
          path: file.path,
          html_url: file.html_url,
          download_url: file.download_url || "",
          size: 0, // Size will be fetched if needed
          sha: file.sha
        }));
      
      return mdFiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list documents in category: ${errorMessage}`);
    }
  }

  /**
   * Get a specific markdown document from a category
   * @param options The category and document to fetch
   * @returns Promise with the document content and metadata
   */
  async getDocumentFromCategory(options: {
    category: string;
    document: string;
  }): Promise<DocFile> {
    try {
      // First, get all categories to find the matching one
      const categories = await this.getDocCategories();
      
      // Find the category that matches the requested one (case-insensitive)
      const categoryName = options.category.toLowerCase();
      const category = categories.find(cat => 
        cat.name.toLowerCase().includes(categoryName) || 
        cat.path.toLowerCase().includes(categoryName)
      );
      
      if (!category) {
        throw new Error(`Category "${options.category}" not found`);
      }
      
      // Get all files in the category
      const response = await this.client.get<GitHubContent[]>(
        `repos/${this.owner}/${this.repo}/contents/${category.path}`,
        {}
      );
      
      const contents = response as GitHubContent[];
      
      // Find markdown files
      const mdFiles = contents.filter(item => 
        item.type === "file" && 
        item.name.endsWith(".md")
      );
      
      // Find the requested document (case-insensitive)
      const docName = options.document.toLowerCase();
      const docFile = mdFiles.find(file => 
        file.name.toLowerCase().includes(docName) || 
        file.path.toLowerCase().includes(docName)
      );
      
      if (!docFile) {
        throw new Error(`Document "${options.document}" not found in category "${category.name}"`);
      }
      
      // Get the content of the file
      const fileResponse = await this.client.get<{
        content: string;
        encoding: string;
        size: number;
        name: string;
        path: string;
        sha: string;
        url: string;
        html_url: string;
        download_url: string;
      }>(
        `repos/${this.owner}/${this.repo}/contents/${docFile.path}`,
        {}
      );
      
      const fileContent = fileResponse as {
        content: string;
        encoding: string;
        size: number;
        name: string;
        path: string;
        sha: string;
        url: string;
        html_url: string;
        download_url: string;
      };
      
      // GitHub returns content as base64 encoded
      const content = fileContent.encoding === "base64" 
        ? new TextDecoder().decode(
            this.base64Decode(fileContent.content)
          )
        : fileContent.content;
      
      return {
        name: fileContent.name,
        path: fileContent.path,
        content,
        html_url: fileContent.html_url,
        download_url: fileContent.download_url,
        size: fileContent.size,
        sha: fileContent.sha,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch document: ${errorMessage}`);
    }
  }

  /**
   * Get all markdown documents in a specific category and merge their content
   * @param category The category name to get documents from
   * @returns Promise with the merged content of all documents in the category
   */
  async getAllDocumentsByCategory(category: string): Promise<string> {
    try {
      // Get all documents in the category
      const documents = await this.listDocumentsInCategory(category);
      
      if (documents.length === 0) {
        return `No documents found in category "${category}"`;
      }
      
      // Create an array to hold all the document contents
      const contentPromises = documents.map(async (doc) => {
        try {
          const fullDoc = await this.getDocumentFromCategory({
            category,
            document: doc.name
          });
          
          // Format each document with a clear header - ensure consistent newline formatting
          // Use a consistent header pattern that our test can reliably match
          return `\n\n## ${doc.name.replace('.md', '')}\n\n${fullDoc.content}`;
        } catch (error) {
          // If we can't fetch a specific document, include an error message instead
          const errorMessage = error instanceof Error ? error.message : String(error);
          return `\n\n## ${doc.name.replace('.md', '')} (Error)\n\nFailed to fetch document: ${errorMessage}`;
        }
      });
      
      // Wait for all document fetches to complete
      const contentArray = await Promise.all(contentPromises);
      
      // Create category header
      const categoryHeader = `# ${this.formatCategoryName(category)} Documentation\n\n`;
      
      // Join all document contents with the category header
      return categoryHeader + contentArray.join('\n\n---\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get all documents in category: ${errorMessage}`);
    }
  }

  /**
   * Format a category folder name to a more readable format
   * Converts names like "01_getting-started" to "Getting Started"
   * @param folderName The raw folder name from GitHub
   * @returns A formatted, human-readable category name
   */
  private formatCategoryName(folderName: string): string {
    // Remove any leading numbers and underscores (e.g., "01_")
    const withoutPrefix = folderName.replace(/^\d+_/, "");
    
    // Replace hyphens and underscores with spaces
    const withSpaces = withoutPrefix.replace(/[-_]/g, " ");
    
    // Capitalize each word
    return withSpaces
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  
  /**
   * Decode a base64 string to Uint8Array
   * This is a Deno-friendly implementation that doesn't rely on Buffer
   * @param b64String The base64 encoded string
   * @returns Decoded Uint8Array
   */
  private base64Decode(b64String: string): Uint8Array {
    return Uint8Array.from(atob(b64String), c => c.charCodeAt(0));
  }
}
