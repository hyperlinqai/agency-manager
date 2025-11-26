import { QueryClient } from "@tanstack/react-query";

function getAuthToken(): string | null {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return user.token;
  }
  return null;
}

async function handleRequest(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Clone the response so we can read the body multiple times if needed
  const responseClone = response.clone();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Try to get error message from response
      let errorMessage = "Authentication failed";
      try {
        const responseText = await responseClone.text();
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = responseText;
          }
        }
      } catch {
        // Ignore parsing errors
      }
      
      console.error("Authentication error:", errorMessage);
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error(errorMessage);
    }

    let errorMessage = `Request failed: ${response.status}`;
    try {
      const responseText = await responseClone.text();
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = responseText;
        }
      }
    } catch {
      // Ignore parsing errors
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  return handleRequest(url, options);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const params = queryKey[1] as Record<string, any> | undefined;

        let fullUrl = url;
        if (params) {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              searchParams.append(key, String(value));
            }
          });
          const queryString = searchParams.toString();
          if (queryString) {
            fullUrl = `${url}?${queryString}`;
          }
        }

        return handleRequest(fullUrl);
      },
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60,
    },
  },
});
