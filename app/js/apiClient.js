/**
 * API Client - HTTP client with retry, caching, and interceptors
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    /**
     * Create API client instance
     */
    function createClient(options = {}) {
        const config = {
            baseURL: options.baseURL || '',
            timeout: options.timeout || 30000,
            headers: options.headers || {},
            retries: options.retries || 3,
            retryDelay: options.retryDelay || 1000,
            cache: options.cache || false,
            cacheDuration: options.cacheDuration || 60000, // 1 minute
            ...options
        };

        const requestInterceptors = [];
        const responseInterceptors = [];
        const cache = new Map();

        /**
         * Add request interceptor
         */
        function addRequestInterceptor(fn) {
            requestInterceptors.push(fn);
            return () => {
                const index = requestInterceptors.indexOf(fn);
                if (index > -1) requestInterceptors.splice(index, 1);
            };
        }

        /**
         * Add response interceptor
         */
        function addResponseInterceptor(fn) {
            responseInterceptors.push(fn);
            return () => {
                const index = responseInterceptors.indexOf(fn);
                if (index > -1) responseInterceptors.splice(index, 1);
            };
        }

        /**
         * Apply request interceptors
         */
        async function applyRequestInterceptors(requestConfig) {
            let cfg = { ...requestConfig };
            for (const interceptor of requestInterceptors) {
                cfg = await interceptor(cfg) || cfg;
            }
            return cfg;
        }

        /**
         * Apply response interceptors
         */
        async function applyResponseInterceptors(response, requestConfig) {
            let res = response;
            for (const interceptor of responseInterceptors) {
                res = await interceptor(res, requestConfig) || res;
            }
            return res;
        }

        /**
         * Make HTTP request
         */
        async function request(url, options = {}) {
            let requestConfig = {
                url: config.baseURL + url,
                method: options.method || 'GET',
                headers: { ...config.headers, ...options.headers },
                body: options.body,
                params: options.params,
                timeout: options.timeout || config.timeout,
                cache: options.cache ?? config.cache,
                retries: options.retries ?? config.retries
            };

            // Apply request interceptors
            requestConfig = await applyRequestInterceptors(requestConfig);

            // Add query params
            if (requestConfig.params) {
                const searchParams = new URLSearchParams(requestConfig.params);
                requestConfig.url += (requestConfig.url.includes('?') ? '&' : '?') + searchParams;
            }

            // Check cache
            const cacheKey = `${requestConfig.method}:${requestConfig.url}`;
            if (requestConfig.cache && requestConfig.method === 'GET') {
                const cached = cache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < config.cacheDuration) {
                    return cached.data;
                }
            }

            // Prepare fetch options
            const fetchOptions = {
                method: requestConfig.method,
                headers: requestConfig.headers
            };

            // Handle body
            if (requestConfig.body) {
                if (requestConfig.body instanceof FormData) {
                    fetchOptions.body = requestConfig.body;
                } else if (typeof requestConfig.body === 'object') {
                    fetchOptions.body = JSON.stringify(requestConfig.body);
                    fetchOptions.headers['Content-Type'] = 'application/json';
                } else {
                    fetchOptions.body = requestConfig.body;
                }
            }

            // Make request with retry
            let lastError;
            for (let attempt = 0; attempt <= requestConfig.retries; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout);

                    const response = await fetch(requestConfig.url, {
                        ...fetchOptions,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    // Parse response
                    let data;
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        data = await response.text();
                    }

                    // Create response object
                    let result = {
                        data,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        ok: response.ok
                    };

                    // Apply response interceptors
                    result = await applyResponseInterceptors(result, requestConfig);

                    // Throw on HTTP errors
                    if (!response.ok) {
                        const error = new Error(data.message || response.statusText);
                        error.response = result;
                        throw error;
                    }

                    // Cache successful GET responses
                    if (requestConfig.cache && requestConfig.method === 'GET') {
                        cache.set(cacheKey, {
                            data: result,
                            timestamp: Date.now()
                        });
                    }

                    return result;

                } catch (error) {
                    lastError = error;

                    // Don't retry on abort or 4xx errors
                    if (error.name === 'AbortError' || 
                        (error.response && error.response.status >= 400 && error.response.status < 500)) {
                        break;
                    }

                    // Wait before retry
                    if (attempt < requestConfig.retries) {
                        await new Promise(resolve => 
                            setTimeout(resolve, config.retryDelay * (attempt + 1))
                        );
                    }
                }
            }

            throw lastError;
        }

        /**
         * GET request
         */
        function get(url, options = {}) {
            return request(url, { ...options, method: 'GET' });
        }

        /**
         * POST request
         */
        function post(url, data, options = {}) {
            return request(url, { ...options, method: 'POST', body: data });
        }

        /**
         * PUT request
         */
        function put(url, data, options = {}) {
            return request(url, { ...options, method: 'PUT', body: data });
        }

        /**
         * PATCH request
         */
        function patch(url, data, options = {}) {
            return request(url, { ...options, method: 'PATCH', body: data });
        }

        /**
         * DELETE request
         */
        function del(url, options = {}) {
            return request(url, { ...options, method: 'DELETE' });
        }

        /**
         * Clear cache
         */
        function clearCache(pattern) {
            if (!pattern) {
                cache.clear();
                return;
            }

            for (const key of cache.keys()) {
                if (key.includes(pattern)) {
                    cache.delete(key);
                }
            }
        }

        /**
         * Set default header
         */
        function setHeader(key, value) {
            config.headers[key] = value;
        }

        /**
         * Remove default header
         */
        function removeHeader(key) {
            delete config.headers[key];
        }

        /**
         * Set auth token
         */
        function setAuthToken(token, type = 'Bearer') {
            if (token) {
                config.headers['Authorization'] = `${type} ${token}`;
            } else {
                delete config.headers['Authorization'];
            }
        }

        return {
            request,
            get,
            post,
            put,
            patch,
            delete: del,
            clearCache,
            setHeader,
            removeHeader,
            setAuthToken,
            addRequestInterceptor,
            addResponseInterceptor,
            config
        };
    }

    // Default client for Quest Mini API
    const apiClient = createClient({
        baseURL: '',
        timeout: 30000,
        headers: {
            'Accept': 'application/json'
        }
    });

    // Add logging interceptor in development
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
        apiClient.addRequestInterceptor((config) => {
            console.log(`🌐 API Request: ${config.method} ${config.url}`);
            return config;
        });

        apiClient.addResponseInterceptor((response, config) => {
            console.log(`✅ API Response: ${config.method} ${config.url} - ${response.status}`);
            return response;
        });
    }

    // Blockchain RPC helper
    function createRPCClient(rpcUrl) {
        const client = createClient({ baseURL: rpcUrl });

        async function call(method, params = []) {
            const response = await client.post('', {
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params
            });
            
            if (response.data.error) {
                throw new Error(response.data.error.message);
            }
            
            return response.data.result;
        }

        return {
            call,
            getBalance: (address) => call('eth_getBalance', [address, 'latest']),
            getBlockNumber: () => call('eth_blockNumber'),
            getGasPrice: () => call('eth_gasPrice'),
            sendTransaction: (tx) => call('eth_sendTransaction', [tx]),
            getTransactionReceipt: (hash) => call('eth_getTransactionReceipt', [hash])
        };
    }

    // Export API
    window.APIClient = {
        create: createClient,
        createRPCClient,
        
        // Default client methods
        get: apiClient.get,
        post: apiClient.post,
        put: apiClient.put,
        patch: apiClient.patch,
        delete: apiClient.delete,
        request: apiClient.request,
        setHeader: apiClient.setHeader,
        setAuthToken: apiClient.setAuthToken,
        clearCache: apiClient.clearCache
    };

    console.log('🌐 APIClient module initialized');
})();
