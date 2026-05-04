export const storageEnabled = true;

export async function uploadFile(): Promise<void> {
    throw new Error("Browser-side storage writes are not supported in local mode");
}

export async function downloadFile(): Promise<ArrayBuffer | null> {
    throw new Error("Browser-side storage reads are not supported in local mode");
}

export async function getSignedUrl(key: string): Promise<string> {
    return key;
}

export function storageKey(
    userId: string,
    docId: string,
    filename: string,
): string {
    return `documents/${userId}/${docId}/${filename}`;
}

export function pdfStorageKey(
    userId: string,
    docId: string,
    stem: string,
): string {
    return `documents/${userId}/${docId}/${stem}.pdf`;
}

export function generatedDocKey(
    userId: string,
    docId: string,
    filename: string,
): string {
    return `generated/${userId}/${docId}/${filename}`;
}
