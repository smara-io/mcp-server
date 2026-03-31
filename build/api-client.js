const BASE_URL = process.env.SMARA_API_URL || "https://api.smara.io";
const API_KEY = process.env.SMARA_API_KEY;
export async function smaraFetch(path, options = {}) {
    if (!API_KEY)
        throw new Error("SMARA_API_KEY environment variable is required. Get a free key at https://smara.io");
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Smara API ${res.status}: ${text}`);
    }
    return res.json();
}
