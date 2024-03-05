import EXIF from "exif-js";
import exifr from 'exifr'

export const compressImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number,
  shouldResize: boolean
): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    const imgElement = document.createElement("img");
    imgElement.onload = () => {
      let width = imgElement.width;
      let height = imgElement.height;

      if (shouldResize) {
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(imgElement, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas to Blob conversion failed"));
          }
        },
        "image/jpeg",
        0.8
      );
    };

    imgElement.onerror = () => {
      reject(new Error("Error in loading image"));
    };
    const fileURL = URL.createObjectURL(file);
    imgElement.src = fileURL;
  });
};

export const compressAvatar = async (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    const imgElement = document.createElement("img");
    imgElement.onload = () => {
      let width = imgElement.width;
      let height = imgElement.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(imgElement, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas to Blob conversion failed"));
          }
        },
        "image/jpeg",
        0.5
      );
    };

    imgElement.onerror = () => {
      reject(new Error("Error in loading image"));
    };
    const fileURL = URL.createObjectURL(file);
    imgElement.src = fileURL;
  });
};

export const processEXIFData = async (
  file: File
): Promise<[number[], string | null, string]> => {
  try {
    const output = await exifr.parse(file, { gps: true, xmp: true })
    let coordinates: number[] = [];
    let locationName = "";
    let dateCaptured: string | null = null;

    if (output && output.latitude && output.longitude) {
      coordinates = [output.longitude, output.latitude];
      
      try {
        locationName = await fetchLocation(output.latitude, output.longitude);
      } catch (error) {
        console.error("Error fetching location:", error);
        locationName = "";
      }
    }

    dateCaptured = output.DateTimeOriginal || output.DateTimeDigitized || output.DateTime;

    return [coordinates, dateCaptured, locationName];
  } catch (error) {
    console.error("Error processing EXIF data:", error);
    return [[], null, ""];
  }
};

// export const processEXIFData = (
//   file: File
// ): Promise<[number[], string | null, string]> => {
//   return new Promise(async (resolve, reject) => {
//     EXIF.getData(file as any, async function () {
//       const allMetaData = EXIF.getAllTags(file);
//       //console.log("METADATA: ", allMetaData)
//       const lon = EXIF.getTag(file, "GPSLongitude");
//       const lat = EXIF.getTag(file, "GPSLatitude");
//       let dateCaptured: string | null = null;

//       const dateTimeOriginal = EXIF.getTag(file, "DateTimeOriginal");
//       const dateTimeDigitized = EXIF.getTag(file, "DateTimeDigitized");
//       const dateTime = EXIF.getTag(file, "DateTime");

//       if (dateTimeOriginal) {
//         dateCaptured = dateTimeOriginal;
//       } else if (dateTimeDigitized) {
//         dateCaptured = dateTimeDigitized;
//       } else if (dateTime) {
//         dateCaptured = dateTime;
//       }

//       let coordinates: number[] = [];
//       let locationName = "";
//       if (lat && lon) {
//         const lonDD = convertDMSToDD(
//           lon[0],
//           lon[1],
//           lon[2],
//           allMetaData.GPSLongitudeRef
//         );
//         const latDD = convertDMSToDD(
//           lat[0],
//           lat[1],
//           lat[2],
//           allMetaData.GPSLatitudeRef
//         );
//         coordinates = [lonDD, latDD];
//         try {
//           locationName = await fetchLocation(latDD, lonDD);
//           //console.log("LOCATION: ", locationName);
//         } catch (error) {
//           console.error("Error fetching location:", error);
//         }
//       }
//       //console.log("META UPDATES: ", coordinates, dateCaptured, locationName)
//       resolve([coordinates, dateCaptured, locationName]);
//     });
//   });
// };

// function convertDMSToDD(
//   degrees: number,
//   minutes: number,
//   seconds: number,
//   direction: string
// ) {
//   var dd = degrees + minutes / 60 + seconds / 3600;

//   if (direction === "S" || direction === "W") {
//     dd = dd * -1;
//   }
//   return dd;
// }

const fetchLocation = async (lat: number, lon: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    fetch(`/api/reverseGeocode?latitude=${lat}&longitude=${lon}`)
      .then((response) => response.json())
      .then((data) => {
        //console.log("DATA: ", data);
        if (data.locality === data.city) {
          data.locality = "";
        }
        const detailedLocation = [data.locality, data.city, data.country]
          .filter(Boolean)
          .join(", ");
        //console.log("DETAILED: ", detailedLocation);
        //setLocationName(data.locationName);
        resolve(detailedLocation);
      })
      .catch((error) => {
        console.error("Error:", error);
        reject(error);
      });
  });
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      resolve(event.target?.result?.toString() || "");
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
    fileReader.readAsDataURL(file);
  });
};

export function constructFullImageUrl(imageReference: string) {
  const baseUrl = "https://cdn.legasee.online/images";
  return `${baseUrl}/${imageReference}`;
}

export function constructThumbImageUrl(imageReference: string) {
  const baseUrl =
    "https://cdn.legasee.online/thumbnails/images";
  return `${baseUrl}/${imageReference}`;
}

export function constructAvatarImageUrl(imageReference: string) {
  const baseUrl =
    "https://cdn.legasee.online/avatars";
  return `${baseUrl}/${imageReference}`;
}

// export const avatarLoader = ({ src, width, quality }: any) => {
//   return `https://cdn.legasee.online/avatars/${src}?w=${width}&q=${quality || 75}`
// }