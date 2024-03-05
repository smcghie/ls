"use client";

import ProfileHeader from "@/components/shared/ProfileHeader";
import callApi from "@/utilities/api";
import { getPresignedAvatarUploadUrl } from "@/utilities/apiUtils";
import { compressAvatar, readFileAsDataURL } from "@/utilities/helpers";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useState } from "react";
import { z } from "zod";

interface User {
  id: string;
  avatar: string;
  name: string;
  username: string;
}

const Settings = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newUsername, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  const updatePasswordValidation = z.object({
    oldPassword: z.string().min(6, "Old password is required"),
    newPassword: z.string().min(6, "New password is required"),
  });

  const updateAvatarValidation = z.object({
    avatarUrl: z.string().url("Must be a valid URL"),
  });

  const updateUsernameValidation = z.object({
    newUsername: z.string().min(3, "Username is required"),
  });

  const updateEmailValidation = z.object({
    email: z.string().email("Must be a valid email"),
  });

  const handleImage = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (imageDataUrl: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.includes("image")) return;

      const loweredQualityImage = await compressAvatar(file, 150, 150);
      const loweredQualityFile = new File([loweredQualityImage], file.name, {
        type: file.type,
        lastModified: new Date().getTime(),
      });
      const loweredDataUrl = await readFileAsDataURL(loweredQualityFile);
      setAvatarUrl(loweredDataUrl);
      setFiles(Array.from([loweredQualityFile]));

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";

        fieldChange(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
    }
  };

  const updateAvatar = async () => {
    const result = updateAvatarValidation.safeParse({ avatarUrl });
    if (!result.success) {
      console.error(result.error);
      return;
    }
    if (!files || files.length === 0) {
      alert("Please select a file first!");
      return;
    }

    setIsUploading(true);

    try {
      const file = files[0];
      const uniqueFilename: string = `${Date.now()}-${file.name}`;
      //console.log("FILENAME: ", uniqueFilename);
      const imageUrl = `${uniqueFilename}`;
      const presignedUrl: string | null = await getPresignedAvatarUploadUrl(
        uniqueFilename
      );
      //console.log("PRESIGNED URL: ", presignedUrl);
      if (presignedUrl) {
        const upload = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (upload.ok === true) {
          //console.log("UPLOAD: ", upload);
          const res = await callApi(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/updateAvatar`,
            {
              method: "PATCH",
              body: { avatarUrl: imageUrl },
            }
          );
          if (res) {
            console.log("Avatar successfully added to database");
            localStorage.setItem("currentUserProfile", JSON.stringify(res));
            setShowAvatarInput(false);
          } else {
            throw new Error("Failed to add avatar to database");
          }
        } else {
          throw new Error("Failed to upload avatar to bucket");
        }
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const updatePassword = async () => {
    const result = updatePasswordValidation.safeParse({
      oldPassword,
      newPassword,
    });
    if (!result.success) {
      console.error(result.error);
      return;
    }
    try {
      const data = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/updatePassword`,
        {
          method: "PATCH",
          body: { oldPassword, newPassword },
        }
      );
      console.log("Password updated successfully:", data);
    } catch (error) {
      console.error("Failed to update password:", error);
    }
  };

  const updateUsername = async () => {
    const result = updateUsernameValidation.safeParse({ newUsername });
    if (!result.success) {
      console.error(result.error);
      return;
    }
    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/updateUsername`,
        {
          method: "PATCH",
          body: { newUsername },
        }
      );
      if (res) {
        localStorage.setItem("currentUserProfile", JSON.stringify(res));
        console.log("Username updated successfully:", res);
      }
    } catch (error) {
      console.error("Failed to update username:", error);
    }
  };

  const updateEmail = async () => {
    const result = updateEmailValidation.safeParse({ email });
    if (!result.success) {
      console.error(result.error);
      return;
    }
    try {
      const data = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/updateEmail`,
        {
          method: "PATCH",
          body: { email },
        }
      );
      console.log("Email updated successfully:", data);
    } catch (error) {
      console.error("Failed to update email:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 text-light-1">
      <div>
        {currentUser && (
          <ProfileHeader
            avatar={currentUser.avatar}
            id={currentUser.id}
            name={currentUser.name}
            username={currentUser.username}
          />
        )}
      </div>
      {isUploading && (
        <div className="loader-container">
          <div
            id="loader"
            className="loader"
            style={{ display: "block" }}
          ></div>
        </div>
      )}

      <div className="mb-4 flex flex-col items-center justify-center pb-4 mt-16">
        <h2 onClick={() => setShowAvatarInput(!showAvatarInput)}>Avatar</h2>
        {showAvatarInput && (
          <div className="flex flex-col justify-center items-center">
            {imageDataUrl ? (
              <div className="relative flex h-20 w-20 mb-4 mt-4">
                <Image
                  src={imageDataUrl}
                  alt="profile photo"
                  fill
                  priority
                  className="rounded-full object-cover shadow-2xl"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center mt-4">
                <Image
                  src="/assets/create.svg"
                  alt="profile photo"
                  width={48}
                  height={48}
                  className="object-contain text-light-1 mb-4"
                />
                <p>Select an avatar</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              placeholder="Upload a photo"
              className="bg-tb-3 opacity-50 text-light-1 justify-center items-center"
              onChange={(e) => handleImage(e, setImageDataUrl)}
            />
          </div>
        )}
        {showAvatarInput && (
          <button className="standard_btn" onClick={updateAvatar}>
            Update Avatar
          </button>
        )}
      </div>

      <div className="mb-4 pb-4 flex flex-col items-center">
        <h2
          className="cursor-pointer"
          onClick={() => setShowPasswordInput(!showPasswordInput)}
        >
          Password
        </h2>
        {showPasswordInput && (
          <div className="flex flex-col items-start items-center pb-4 mt-4">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Old Password"
              className="input-box"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="input-box"
            />
            <button className="standard_btn" onClick={updatePassword}>
              Update Password
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 pb-4 flex flex-col items-center">
        <h2
          className="cursor-pointer"
          onClick={() => setShowUsernameInput(!showUsernameInput)}
        >
          Username
        </h2>
        {showUsernameInput && (
          <div className="flex flex-col items-start items-center pb-4 mt-4">
            <input
              className="input-box"
              placeholder="Update username"
              type="text"
              value={newUsername}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className="standard_btn" onClick={updateUsername}>
              Update Username
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-col items-center">
        <h2
          className="cursor-pointer"
          onClick={() => setShowEmailInput(!showEmailInput)}
        >
          Email
        </h2>
        {showEmailInput && (
          <div className="flex flex-col items-start items-center mt-4">
            <input
              type="email"
              className="input-box"
              placeholder="Update email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="standard_btn" onClick={updateEmail}>
              Update Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
