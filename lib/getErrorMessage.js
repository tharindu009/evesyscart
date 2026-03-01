export default function getErrorMessage(error) {
    const respErr = error?.response?.data?.error ?? error?.response?.data?.message ?? error?.message ?? error;
    if (typeof respErr === 'string') return respErr;
    if (respErr && typeof respErr === 'object') return respErr.message ?? JSON.stringify(respErr);
    try { return String(respErr); } catch { return 'An unknown error occurred'; }
}
