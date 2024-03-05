type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface CallApiOptions {
    method: HttpMethod;
    body?: any; 
    headers?: HeadersInit;
}

const callApi = async (url: string, options: CallApiOptions): Promise<any> => {
    const { method, body, headers } = options;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        credentials: "include"
    };

    if (method !== 'GET' && body) {
        config.body = JSON.stringify(body);
    }

    try {
        //console.log('Making API call with config:', config);
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API call failed: ${response.status} ${response.statusText}, Body: ${errorBody}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error during API call:', error);
        throw error;
    }
};

export default callApi;


