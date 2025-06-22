import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get API key from localStorage
export const getApiKey = (): string | null => {
  if (typeof window !== "undefined") {
    const apiKey = localStorage.getItem("api_key");
    if (!apiKey) {
      console.warn("getApiKey: No API key found in localStorage");
      console.log("getApiKey: Available localStorage keys:", Object.keys(localStorage));
    }
    return apiKey;
  }
  console.warn("getApiKey: Window not available (SSR context)");
  return null;
};

export const apiRequest = async (
  urlOrOptions: string | {
    url: string;
    method?: string;
    body?: any;
    requireAuth?: boolean;
  },
  method: string = "GET",
  body?: any,
  requireAuth: boolean = true
) => {
  // Handle both old and new calling styles
  let url: string;
  let actualMethod: string;
  let actualBody: any;
  let actualRequireAuth: boolean;

  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    actualMethod = method;
    actualBody = body;
    actualRequireAuth = requireAuth;
  } else {
    url = urlOrOptions.url;
    actualMethod = urlOrOptions.method || "GET";
    actualBody = urlOrOptions.body;
    actualRequireAuth = urlOrOptions.requireAuth !== false;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (actualRequireAuth) {
    const apiKey = getApiKey();
    console.log("APIRequest: Attempting to get API key, found:", apiKey ? "Yes" : "No");
    if (!apiKey) {
      console.error("APIRequest: No API key found in localStorage");
      throw new Error("No API key found. Please log in again.");
    }
    headers["Authorization"] = `Bearer ${apiKey}`;
    console.log("APIRequest: Added Authorization header for", url);
  }

  const config: RequestInit = {
    method: actualMethod,
    headers,
    credentials: "include",
  };

  if (actualBody && actualMethod !== "GET") {
    config.body = JSON.stringify(actualBody);
  }

  console.log("APIRequest: Making request to", url, "with headers:", headers);
  const response = await fetch(url, config);
  if (!response.ok) {
    // Try to get error message from response body
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  // If there's no content (204 No Content) or content-length is 0, return null
  if (response.status === 204 || contentLength === '0') {
    return null;
  }

  // If content type is not JSON, return text
  if (!contentType?.includes('application/json')) {
    return await response.text();
  }

  // For successful responses with JSON content, parse JSON
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    // If JSON parsing fails but response was successful, return null
    console.warn('Failed to parse JSON response, returning null:', error);
    return null;
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const apiKey = getApiKey();
    const headers: Record<string, string> = {};

    // Add API key to headers if available
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});