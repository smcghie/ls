import React, {
  useState,
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  CreateMomentValidation,
} from "@/lib/validations/moment";
import {
  processEXIFData,
  readFileAsDataURL,
} from "@/utilities/helpers";
import { getPresignedUploadUrl } from "@/utilities/apiUtils";
import debounce from "lodash.debounce";
import callApi from "@/utilities/api";
import { User } from "@/models/models";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import { isBase64Image } from "@/utilities/utils";

interface AddToAlbum {
  albumId: string;
  onMomentAdded: (updatedAlbum: Album) => void;
  onClose: () => void;
}

interface FileData {
  id: string;
  imageDataUrl: string;
  file: File;
  fileSize: number;
  coordinates: number[];
  captureDate: string;
  description: string;
}

interface Moment {
  image: string;
  coordinates: number[];
  captureDate: string;
  description: string;
}

interface Album {
  id: string;
  title: string;
  moments: Moment[];
  createdBy: string;
  albumType: string;
}

const AddToAlbum = ({ albumId, onMomentAdded, onClose }: AddToAlbum) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalUploadData, setTotalUploadData] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  const form = useForm<z.infer<typeof CreateMomentValidation>>({
    resolver: zodResolver(CreateMomentValidation),
    defaultValues: {
      image: "",
      description: "",
      coordinates: [0, 0],
      commentCount: 0,
      captureDate: "",
      albumId: "",
    },
  });

  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const fileDataArray: FileData[] = [];

      for (const file of files) {
        setFileCount((prev) => (prev += 1));
        if (!file.type.includes("image")) continue;

        const fileCoordinates = await processEXIFData(file);
        //console.log("file Coordinates: ", fileCoordinates[0]);

        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/uploadImage", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to compress the image.");
        const blob = await response.blob();
        const roundedFileSize = parseFloat((blob.size / 1024).toFixed(1));
        setTotalUploadData((prev) => (prev += roundedFileSize));

        const loweredQualityFile = new File([blob], file.name, {
          type: blob.type,
          lastModified: new Date().getTime(),
        });

        const loweredDataUrl = await readFileAsDataURL(loweredQualityFile);
        //console.log("File coordinates: ", fileCoordinates);
        const confirmedImage = isBase64Image(loweredDataUrl);
        if (confirmedImage) {
          const id = `${file.name}-${Date.now()}`;
          fileDataArray.push({
            id,
            imageDataUrl: loweredDataUrl,
            file: loweredQualityFile,
            fileSize: roundedFileSize,
            coordinates: fileCoordinates[0] || [],
            captureDate: fileCoordinates[1] || "",
            description: fileCoordinates[2] || "",
          });
        }
      }
      setFiles(fileDataArray);
    }
  };

  useEffect(() => {
    {
      files.length > 0 && console.log("FILEDATAARRAY: ", files);
    }
  }, [files]);

  const onSubmit = async () => {
    if (files.length === 0) {
      alert("Please add a photo first!");
      return;
    }

    const userTypeAllowance = Number(
      currentUser?.userType === "premium"
        ? process.env.PREMIUM_ALLOWANCE
        : process.env.REGULAR_ALLOWANCE
    );

    if (
      currentUser &&
      currentUser.totalDataUsed + totalUploadData > userTypeAllowance
    ) {
      alert(
        "You've exceeded your storage allowance. Please upgrade to premium or remove some images and try again"
      );
      return;
    }

    setIsUploading(true);

    const moments: Moment[] = [];
    try {
      const uploadPromises = files.map(async (fileData) => {
        const uniqueFilename = `${Date.now()}-${fileData.file.name}`;
        const imageUrl = `${uniqueFilename}`;
        const presignedUrl = await getPresignedUploadUrl(uniqueFilename);

        if (presignedUrl) {
          await fetch(presignedUrl, {
            method: "PUT",
            body: fileData.file,
            headers: {
              "Content-Type": fileData.file.type,
            },
          });

          const momentData = {
            image: imageUrl,
            description: fileData.description,
            coordinates: fileData.coordinates,
            commentCount: 0,
            captureDate: fileData.captureDate,
            albumId: albumId,
            fileSize: fileData.fileSize,
            fileType: fileData.file.type,
          };
          //console.log("MOMENT DATA: ", momentData);
          moments.push(momentData);
        }
      });

      await Promise.all(uploadPromises);

      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/moment/${albumId}`,
        {
          method: "POST",
          body: { moments },
        }
      );

      if (res) {
        debouncedFetchMomentsData(res);
        console.log("Album successfully updated with new moments");
      } else {
        throw new Error("Failed to add moments to album");
      }
    } catch (error) {
      console.error("Error during upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const debouncedFetchMomentsData = useCallback(
    debounce((updatedAlbum) => {
      onMomentAdded(updatedAlbum);
    }, 4000),
    []
  );

  const removeImage = (id: string) => {
    setFiles(files.filter((file) => file.id !== id));
    setFileCount((prevCount) => prevCount - 1);
  };

  useEffect(() => {
    return () => {
      debouncedFetchMomentsData.cancel();
    };
  }, [debouncedFetchMomentsData]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="overlay flex justify-center items-center h-full">
      {isUploading ? (
        <div className="loader"></div>
      ) : (
        <>
          <div className="w-[700px] h-[400px] max-md:w-screen overflow-y-auto overflow-x-hidden border border-gray-3 border-dashed relative">
            {files.length > 0 ? (
              <div className="grid grid-cols-auto-fill gap-4 p-4">
                {files.map((fileData, index) => (
                  <div key={fileData.id} className="mb-2 last:mb-0">
                    <img
                      src={fileData.imageDataUrl}
                      alt={`Preview ${index}`}
                      className="w-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(fileData.id)}
                      className="py-1 px-3 bg-red-500 text-white text-tiny-medium rounded hover:bg-red-700 mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">
                <div>No images currently selected.</div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center items-center w-full text-light-1">
            <span className="mb-2">{fileCount} photos selected</span>
            <Button type="button" onClick={handleButtonClick}>
              Select Photos
            </Button>
            <input
              ref={fileInputRef}
              id="hidden-file-input"
              type="file"
              accept="image/*"
              className="account-form_image-input"
              onChange={(e) => handleImage(e)}
              multiple
            />
          </div>
        </>
      )}
      <button
        onClick={onClose}
        className="mt-4 bg-tb-3 text-light-1 py-2 px-4 rounded items-start"
      >
        Close
      </button>
      {files.length > 0 && (
        <button className="standard_btn" onClick={onSubmit}>
          Add To Album
        </button>
      )}
    </div>
  );
};

export default AddToAlbum;
