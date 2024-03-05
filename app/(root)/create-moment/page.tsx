"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  constructAvatarImageUrl,
  processEXIFData,
  readFileAsDataURL,
} from "@/utilities/helpers";
import { CreateAlbumValidation } from "@/lib/validations/album";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import { User } from "@/models/models";
import callApi from "@/utilities/api";
import DisplayFriendsBox from "@/components/shared/DisplayFriendsBox";
import { isBase64Image } from "@/utilities/utils";
import { Progress } from "@/components/ui/progress";

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
  id?: string;
  image: string;
  coordinates: number[];
  captureDate: string;
  description: string;
}

interface Album {
  title: string;
  moments: Moment[];
  albumType: string;
}

const page = () => {
  const router = useRouter();
  const [files, setFiles] = useState<FileData[]>([]);
  const [albumType, setAlbumType] = useState("Personal");
  const [isUploading, setIsUploading] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [userIdsFromChild, setUserIdsFromChild] = useState<string[]>([]);
  const [filteredFriendsList, setFilteredFriendsList] = useState<User[]>([]);
  const [totalFileCount, setTotalFileCount] = useState(0);
  const [totalOriginalCount, setTotalOriginalCount] = useState(0);
  const [currentTotalFileCount, setCurrentTotalFileCount] = useState(0);
  const [totalUploadData, setTotalUploadData] = useState(0);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  useEffect(() => {
    if (fileCount <= totalFileCount && !complete) {
      const maxCount = Math.max(
        Number(totalOriginalCount),
        Number(totalFileCount)
      );
      const minCount = Math.min(
        Number(totalOriginalCount),
        Number(totalFileCount)
      );
      const difference = maxCount - minCount;
      var progress = (Number(currentTotalFileCount) / Number(difference)) * 100;
      setProgress(progress);
    }
    if (fileCount > 0 && fileCount === totalFileCount) {
      setProgress(0);
      setComplete(true);
    }
  }, [fileCount, totalFileCount, complete]);

  useEffect(() => {
    function checkScreenSize() {
      setIsSmallScreen(window.innerWidth < 768);
    }
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleUserIdsChange = (newUserIds: string[]) => {
    setUserIdsFromChild(newUserIds);
    const filtered = friendsList.filter((friend) =>
      newUserIds.includes(friend.id)
    );
    setFilteredFriendsList(filtered);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (albumType === "Shared") {
      fetchFriendsList().then(setFriendsList);
    }
  }, [albumType]);

  async function fetchFriendsList(): Promise<User[]> {
    if (!currentUser) {
      console.log("currentUser not defined");
      return [];
    }

    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/${currentUser.id}/friends`,
        {
          method: "GET",
        }
      );
      const friends: User[] = res;
      //console.log("FRIENDS LIST: ", friends);
      return friends;
    } catch (error) {
      console.error("Failed to fetch friends list:", error);
      throw error;
    }
  }

  const form = useForm<z.infer<typeof CreateAlbumValidation>>({
    resolver: zodResolver(CreateAlbumValidation),
    defaultValues: {
      title: "",
      albumType: "",
      moments: [],
    },
  });

  async function onSubmit(values: z.infer<typeof CreateAlbumValidation>) {
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

    try {
      const momentsData = files.map((fileData) => {
        const uniqueFilename = `${Date.now()}-${fileData.file.name}`;
        return {
          image: uniqueFilename,
          coordinates: fileData.coordinates,
          captureDate: fileData.captureDate,
          description: fileData.description,
          fileSize: fileData.fileSize,
          fileType: fileData.file.type,
        };
      });

      const albumData = {
        title: values.title,
        albumType: albumType,
        moments: momentsData,
        sharedWith: userIdsFromChild,
      };
      //console.log("ALBUMS DATA: ", albumData);

      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/album/createWithMoments`,
        {
          method: "POST",
          body: albumData,
        }
      );

      const { presignedUrls, ...otherData } = await res;

      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const presignedUrl = presignedUrls[i];

        if (presignedUrl) {
          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: fileData.file,
            headers: { "Content-Type": fileData.file.type },
          });

          if (!uploadResponse.ok) {
            console.error("Failed to upload the file: ", momentsData[i].image);
          }
        }
      }

      if (res) {
        router.push("/");
      } else {
        alert("Error creating album and moments");
      }
    } catch (error) {
      console.error("Error during the process:", error);
    } finally {
      setIsUploading(false);
    }
  }

  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const fileDataArray: FileData[] = [];

      setTotalOriginalCount(totalFileCount);
      setTotalFileCount((prev) => (prev += files.length));
      for (const file of files) {
        setComplete(false);
        setCurrentTotalFileCount((prev) => (prev += 1));
        setFileCount((prev) => (prev += 1));

        if (!file.type.includes("image")) continue;

        const fileCoordinates = await processEXIFData(file);

        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/uploadImage", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        //console.log("RESPOSNE: ", response);

        if (!response.ok) throw new Error("Failed to compress the image.");

        const blob = await response.blob();

        const roundedFileSize = parseFloat((blob.size / 1024).toFixed(1));
        setTotalUploadData((prev) => (prev += roundedFileSize));
        const loweredQualityFile = new File([blob], file.name, {
          type: blob.type,
          lastModified: new Date().getTime(),
        });

        const loweredDataUrl = await readFileAsDataURL(loweredQualityFile);
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
      setFiles((prevFiles) => [...prevFiles, ...fileDataArray]);
    }
    setComplete(true);
    setCurrentTotalFileCount(0);
    setProgress(0);
  };

  // useEffect(() => {
  //   {
  //     files.length > 0 && console.log("FILEDATAARRAY: ", files);
  //   }
  // }, [files]);

  const removeImage = (id: string) => {
    setFiles(files.filter((file) => file.id !== id));
    setFileCount((prevCount) => prevCount - 1);
  };

  function DropdownMenuCheckboxes() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-tb-3 bg-opacity-75 text-light-1 border-gray-3"
            variant="outline"
          >
            {albumType}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-tb-3 bg-opacity-75 text-light-1 border-gray-3">
          <DropdownMenuLabel>Select Album Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={albumType}
            onValueChange={setAlbumType}
          >
            <DropdownMenuRadioItem value="Personal">
              Personal
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Trip">Trip</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Shared">Shared</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-full mt-4 pt-16">
      <div>
        {currentUser && isSmallScreen && (
          <ProfileHeader
            avatar={currentUser.avatar}
            id={currentUser.id}
            name={currentUser.name}
            username={currentUser.username}
          />
        )}
      </div>

      {isUploading ? (
        <div className="loader-container">
          <div
            id="loader"
            className="loader"
            style={{ display: "block" }}
          ></div>
        </div>
      ) : (
        <>
          <div className="w-[700px] h-[400px] max-md:w-screen overflow-y-auto overflow-x-hidden border border-gray-3 border-dashed relative">
            {!complete && progress > 0 && (
              <div className="flex items-center justify-center h-full">
                <Progress className="w-[400px]" value={progress} />
              </div>
            )}

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
            <span className="mb-2 w-">{fileCount} photos selected</span>
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

            {albumType === "Shared" && (
              <>
                <div className="text-light-1 pt-4 flex flex-row">
                  <p>Sharing with:</p>
                  {filteredFriendsList.map((result, index) => (
                    <div
                      key={index}
                      className="flex flex-row items-center justify-center pl-2"
                    >
                      <div className="relative flex h-8 w-8">
                        <img
                          src={constructAvatarImageUrl(result.avatar)}
                          alt="profile image"
                          className="rounded-full object-cover shadow-2xl h-full w-full"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <p className="pl-2">{result.username}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <DisplayFriendsBox
                    friends={friendsList}
                    onUserIdsChange={handleUserIdsChange}
                  />
                </div>
              </>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-10 flex flex-col justify-start gap-10"
              >
                <DropdownMenuCheckboxes />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex w-full gap-3 flex-col">
                      <FormControl>
                        <Input
                          className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                          placeholder="Album Name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Submit</Button>
              </form>
            </Form>
          </div>
        </>
      )}
    </div>
  );
};

export default page;