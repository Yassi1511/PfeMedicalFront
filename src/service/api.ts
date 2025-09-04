const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      // Don't set Content-Type by default; let the browser or options handle it
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, token);
  }

  static async post<T>(
    endpoint: string,
    data: any,
    token?: string,
    config: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {};
    let body = data;

    // Only set Content-Type and stringify for non-FormData
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }
    // Merge any additional headers from config
    if (config.headers) {
      Object.assign(headers, config.headers);
    }

    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        body,
        headers,
      },
      token
    );
  }

  static async put<T>(
    endpoint: string,
    data: any,
    token?: string,
    config: RequestInit = {}
  ): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      token
    );
  }

  static async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, token);
  }
}