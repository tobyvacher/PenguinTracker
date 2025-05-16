import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
  options: RequestInit = {}
): Promise<Response> {
  // Try to get the Firebase auth token
  let authHeader = {};
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const token = await user.getIdToken();
      authHeader = {
        Authorization: `Bearer ${token}`
      };
      console.log(`Adding auth token to ${method} request for ${url}`);
    }
  } catch (error) {
    console.error("Error getting auth token for API request:", error);
  }
  
  // Merge default headers with auth header and provided options
  const headers = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...authHeader,
    ...(options.headers || {}),
  };
  
  // Build request options without duplicating headers
  const requestOptions: RequestInit = {
    method,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...options,
  };
  
  // Set headers explicitly
  requestOptions.headers = headers;
  
  const res = await fetch(url, requestOptions);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the current Firebase user token if available
    let headers = {};
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const token = await user.getIdToken();
        headers = {
          Authorization: `Bearer ${token}`
        };
        console.log(`Adding auth token to request for ${queryKey[0]}`);
      } else {
        console.log(`No authenticated user for request ${queryKey[0]}`);
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    
    // Make the request with auth token if available
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
