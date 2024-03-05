// export async function fetchPresignedAvatarUrl(imageKey: string) {
//     const response = await fetch(`/api/presigned-avatar-download?key=${encodeURIComponent(imageKey)}`);
//     const data = await response.json();
//     return data.presignedUrl;
// }

export async function getPresignedAvatarUploadUrl(imageKey: string) {
  const response = await fetch(`/api/presigned-avatar-upload?filename=${encodeURIComponent(imageKey)}`);
  const data = await response.json();
  return data.presignedUrl;
}

export async function fetchPresignedFullUrl(imageKey: string) {
    const response = await fetch(`/api/presigned-url-download?key=${encodeURIComponent(imageKey)}`);
    const data = await response.json();
    return data.presignedUrl;
}

export async function fetchPresignedThumblUrl(imageKey: string) {
    const response = await fetch(`/api/presigned-url-thumb-download?key=${encodeURIComponent(imageKey)}`);
    const data = await response.json();
    return data.presignedUrl;
}

export async function getPresignedUploadUrl(filename: string) {
    const db_url = `/api/presigned-url-upload?filename=${encodeURIComponent(filename)}`;
    const response = await fetch(db_url);
    const data = await response.json();
    return data.presignedUrl;
  }
  
  export async function fetchPresignedAvatarUrl(imageKey: string) {
    const response = await fetch(`/api/presigned-avatar-download?key=${encodeURIComponent(imageKey)}`);
    const data = await response.json();
    return data.presignedUrl;
}
