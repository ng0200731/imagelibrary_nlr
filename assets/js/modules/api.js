// API helpers (no bundler, keep globals via window.*)
/* eslint-disable */

(function initApiModule() {
    // Build API base URL the same way as app.js
    const API_URL = (window.location.origin.includes(':8080'))
        ? window.location.origin.replace(':8080', ':3000')
        : window.location.origin;

    window.API_URL = window.API_URL || API_URL;

    window.getAuthHeaders = function getAuthHeaders(extraHeaders = {}) {
        const sessionToken = localStorage.getItem('sessionToken');
        const headers = { ...extraHeaders };
        if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
        return headers;
    };

    window.apiFetch = async function apiFetch(pathOrUrl, options = {}) {
        const url = String(pathOrUrl).startsWith('http')
            ? String(pathOrUrl)
            : `${window.API_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

        const headers = window.getAuthHeaders(options.headers || {});
        const response = await fetch(url, { ...options, headers });
        return response;
    };

    window.apiJson = async function apiJson(pathOrUrl, options = {}) {
        const response = await window.apiFetch(pathOrUrl, options);
        const text = await response.text();
        let json;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            json = null;
        }
        if (!response.ok) {
            const msg = (json && (json.error || json.message)) ? (json.error || json.message) : text;
            const err = new Error(msg || `Request failed: ${response.status}`);
            err.status = response.status;
            err.responseText = text;
            err.responseJson = json;
            throw err;
        }
        return json;
    };
})();
