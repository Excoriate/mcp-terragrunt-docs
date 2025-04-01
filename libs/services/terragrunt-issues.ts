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

export class TerragruntIssues {
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
}
  