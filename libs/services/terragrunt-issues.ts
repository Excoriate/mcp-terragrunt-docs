import { HttpClient } from "../adapters/http-client.ts";

// Define types for GitHub API responses
export interface GitHubIssue {
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

/**
 * TerragruntIssues provides methods to interact with the Terragrunt GitHub repository's issues.
 *
 * This class enables programmatic access to open issues, supporting use cases such as triage, reporting, and integration with dashboards or automation tools.
 *
 * All methods that fetch issues support authenticated requests via a GitHub token to avoid API rate limiting. It is strongly recommended to provide a valid token for reliable access.
 */
export class TerragruntIssues {
  private client: HttpClient;
  private readonly owner: string;
  private readonly repo: string;

  constructor(
    options: {
      owner?: string;
      repo?: string;
      apiBaseUrl?: string;
      token?: string;
    } = {},
  ) {
    this.owner = options.owner || "gruntwork-io";
    this.repo = options.repo || "terragrunt";
    const apiBaseUrl = options.apiBaseUrl || "https://api.github.com";

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
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
  async getOpenIssues(
    options: {
      perPage?: number;
      page?: number;
    } = {},
  ): Promise<GitHubIssue[]> {
    const queryParams: Record<string, string> = {
      state: "open",
      per_page: String(options.perPage || 30),
      page: String(options.page || 1),
    };

    const response = await this.client.get<GitHubIssue[]>(
      `repos/${this.owner}/${this.repo}/issues`,
      { queryParams },
    );

    return response as GitHubIssue[];
  }

  /**
   * Retrieve all open issues from the Terragrunt GitHub repository, automatically handling pagination.
   *
   * This method returns a complete list of open issues, including detailed metadata for each issue (ID, title, state, URL, labels, author, timestamps, etc.).
   *
   * @param options Optional parameters:
   *   - perPage: Number of issues per page (default: 30, max: 100)
   *   - maxPages: Optional page limit; if undefined, fetches all pages
   * @returns Promise with an array of all open issues
   *
   * @remarks
   * - A valid GitHub token is required to avoid rate limiting. Without a token, the method may fail due to GitHub's strict unauthenticated rate limits.
   * - Use this method for project management, automation, or reporting that requires up-to-date issue data.
   */
  async getAllOpenIssues(
    options: {
      perPage?: number;
      maxPages?: number; // Optional page limit; if undefined, fetch all pages
    } = {},
  ): Promise<GitHubIssue[]> {
    const perPage = options.perPage || 30;
    const maxPages = options.maxPages; // undefined means unlimited

    let currentPage = 1;
    let hasMorePages = true;
    const allIssues: GitHubIssue[] = [];

    while (hasMorePages && (maxPages === undefined || currentPage <= maxPages)) {
      const pageIssues = await this.getOpenIssues({
        perPage,
        page: currentPage,
      });

      allIssues.push(...pageIssues);

      if (pageIssues.length < perPage) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    }

    return allIssues;
  }
}
