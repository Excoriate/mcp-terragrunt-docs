/**
 * A simple HTTP client wrapper around Deno's built-in fetch API.
 */

// Define common HTTP status codes
enum Status {
  OK = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  InternalServerError = 500,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Headers;

  /**
   * Creates an instance of HttpClient.
   * @param baseURL Optional base URL to prepend to relative paths.
   * @param defaultOptions Optional default fetch options (e.g., headers).
   */
  constructor(baseURL = "", defaultOptions: RequestInit = {}) {
    // Ensure baseURL ends with a slash if provided
    this.baseURL = baseURL && !baseURL.endsWith("/") ? `${baseURL}/` : baseURL;
    this.defaultHeaders = new Headers(defaultOptions.headers);

    // Ensure common defaults if not provided
    if (!this.defaultHeaders.has("Accept")) {
      this.defaultHeaders.set("Accept", "application/json");
    }
    // Content-Type is typically set per request (e.g., in POST)
  }

  /**
   * Performs an HTTP request.
   * @param method The HTTP method (GET, POST, PUT, DELETE, etc.).
   * @param path The URL path (relative to baseURL if set, or absolute).
   * @param options Additional fetch options (body, headers, queryParams, etc.).
   * @returns A Promise resolving to the parsed JSON response or raw Response object.
   */
  async request<T = unknown>(
    method: string,
    path: string,
    options: RequestInit & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    } = {},
  ): Promise<T | Response> {
    const url = new URL(path, this.baseURL || undefined); // Use URL constructor for robust path joining

    // Add query parameters if provided (using for...of)
    if (options.queryParams) {
      for (const [key, value] of Object.entries(options.queryParams)) {
        url.searchParams.append(key, value);
      }
    }

    // Merge headers: default < request-specific
    const requestHeaders = new Headers(this.defaultHeaders);
    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        requestHeaders.set(key, value);
      });
    }

    // Default Content-Type for relevant methods if body exists and header isn't set
    if (
      options.body &&
      !requestHeaders.has("Content-Type") &&
      (method === "POST" || method === "PUT" || method === "PATCH")
    ) {
      requestHeaders.set("Content-Type", "application/json");
    }

    // Prepare fetch options
    const _fetchOptions: RequestInit = {
      ...options,
      method: method.toUpperCase(),
      headers: requestHeaders,
    };

    const {
      queryParams: _queryParams,
      parseJson = true,
      ...nativeFetchOptions
    } = options;
    const finalFetchOptions: RequestInit = {
      ...nativeFetchOptions,
      method: method.toUpperCase(),
      headers: requestHeaders,
    };

    try {
      const response = await fetch(url.toString(), finalFetchOptions); // Use cleaned options

      if (!response.ok) {
        // Attempt to read body for more error context, then throw
        let errorBody: string | object =
          `Request failed with status ${response.status}`;
        try {
          const text = await response.text();
          try {
            errorBody = JSON.parse(text); // Try parsing as JSON
          } catch {
            errorBody = text; // Fallback to text
          }
        } catch {
          // Ignore if reading body fails
        }
        throw new HttpError(response.status, errorBody, response.headers);
      }

      // Default to parsing JSON, allow opting out
      if (parseJson) {
        if (
          response.status === Status.NoContent ||
          response.headers.get("content-length") === "0"
        ) {
          // Handle No Content responses
          return undefined as T;
        }
        // Check content-type before assuming JSON
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return (await response.json()) as T;
        }
        // If not JSON but parsing was expected, return raw response with warning
        console.warn(
          `Expected JSON response but received Content-Type: ${contentType}. Returning raw response.`,
        );
        return response;
      }
      // Return the raw Response object if JSON parsing is disabled
      return response;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error; // Re-throw specific HTTP errors
      }
      // Wrap generic network/fetch errors
      throw new Error(
        `HTTP request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // Convenience methods

  /** Performs a GET request. */
  get<T = unknown>(
    path: string,
    options?: Omit<RequestInit, "method" | "body"> & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    },
  ): Promise<T | Response> {
    return this.request<T>("GET", path, options);
  }

  /** Performs a POST request. */
  post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestInit, "method" | "body"> & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    },
  ): Promise<T | Response> {
    const requestOptions = { ...options } as RequestInit & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    };
    if (body !== undefined) {
      requestOptions.body = typeof body === "string"
        ? body
        : JSON.stringify(body);
      // Ensure Content-Type is set if providing a body, unless explicitly overridden
      if (
        !requestOptions.headers ||
        !new Headers(requestOptions.headers).has("Content-Type")
      ) {
        const headers = new Headers(requestOptions.headers);
        headers.set("Content-Type", "application/json");
        requestOptions.headers = headers;
      }
    }
    return this.request<T>("POST", path, requestOptions);
  }

  /** Performs a PUT request. */
  put<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestInit, "method" | "body"> & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    },
  ): Promise<T | Response> {
    const requestOptions = { ...options } as RequestInit & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    };
    if (body !== undefined) {
      requestOptions.body = typeof body === "string"
        ? body
        : JSON.stringify(body);
      if (
        !requestOptions.headers ||
        !new Headers(requestOptions.headers).has("Content-Type")
      ) {
        const headers = new Headers(requestOptions.headers);
        headers.set("Content-Type", "application/json");
        requestOptions.headers = headers;
      }
    }
    return this.request<T>("PUT", path, requestOptions);
  }

  /** Performs a PATCH request. */
  patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestInit, "method" | "body"> & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    },
  ): Promise<T | Response> {
    const requestOptions = { ...options } as RequestInit & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    };
    if (body !== undefined) {
      requestOptions.body = typeof body === "string"
        ? body
        : JSON.stringify(body);
      if (
        !requestOptions.headers ||
        !new Headers(requestOptions.headers).has("Content-Type")
      ) {
        const headers = new Headers(requestOptions.headers);
        headers.set("Content-Type", "application/json");
        requestOptions.headers = headers;
      }
    }
    return this.request<T>("PATCH", path, requestOptions);
  }

  /** Performs a DELETE request. */
  delete<T = unknown>(
    path: string,
    options?: Omit<RequestInit, "method" | "body"> & {
      queryParams?: Record<string, string>;
      parseJson?: boolean;
    },
  ): Promise<T | Response> {
    return this.request<T>("DELETE", path, options);
  }
}

/** Custom Error class for HTTP errors */
export class HttpError extends Error {
  status: number;
  body: string | object | null;
  headers: Headers;

  constructor(status: number, body: string | object | null, headers: Headers) {
    super(`HTTP Error ${status}: ${Status[status] || "Unknown"}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}
