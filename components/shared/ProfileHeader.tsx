"use client";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import Image from "next/image";
import { useEffect, useState } from "react";
import ProfileMenu from "./ProfileMenu";
import AddFriendButton from "./AddFriendButton";
import { User } from "@/models/models";
import callApi from "@/utilities/api";
import Notifications from "./Notifications";
import { constructAvatarImageUrl } from "@/utilities/helpers";
interface Props {
  avatar: string;
  id: string;
  name: string;
  username: string;
}

function ProfileHeader({ avatar, id, name, username }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [friendStatus, setFriendStatus] = useState<string>("");
  const [statusChange, setStatusChange] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFriendRequestStatus = async () => {
      try {
        const response = await callApi(
          `${process.env.NEXT_PUBLIC_API_URL}/friendship/status?senderId=${currentUser.id}&receiverId=${id}`,
          { method: "GET" }
        );
        if (response) {
          //console.log("RESPONSE: ", response);
          if (response.status === "accepted") {
            setIsFriend(true);
            setFriendStatus("accepted");
          } else if (response.status === "pending") {
            setFriendStatus("pending");
            setIsFriend(false);
          } else if (response.status === "cancelled") {
            setFriendStatus("none");
            setIsFriend(false);
          } else if (response.status === "none") {
            setFriendStatus("none");
            setIsFriend(false);
          }
        }
      } catch (error) {
        console.error("Error fetching friend request status:", error);
      }
    };
    if (currentUser.id && id) {
      fetchFriendRequestStatus();
    }
  }, [currentUser, statusChange]);

  const handleFriendStatusChange = () => {
    setStatusChange(!statusChange);
  };

  return (
    <div className="max-md:absolute max-md:top-0 max-md:left-0 max-md:z-10 max-md:bg-black max-md:bg-opacity-40 md:mt-4 flex w-full flex-col justify-start">
      <div className="flex justify-between">
        <div className="flex items-center gap-3 p-1 w-full">
          <div className="relative h-16 w-16 ">
            <img
              src={constructAvatarImageUrl(avatar)}
              alt="profile image"
              className="rounded-full object-cover shadow-2xl h-full w-full"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-left text-heading2-bold text-light-1 close-shadow">
              {name}
            </h2>
            <p className="text-base-medium text-gray-1">@{username}</p>
          </div>
          {currentUser && currentUser.id !== id && isFriend !== null && (
            <div className="flex justify-right">
              <AddFriendButton
                userId={currentUser.id}
                friendId={id}
                isFriend={isFriend}
                friendStatus={friendStatus}
                onFriendStatusChange={handleFriendStatusChange}
              />
            </div>
          )}
        </div>
        <div className="md:hidden max-md:pt-2">
          <Notifications currentUser={currentUser} />
        </div>
        <div className="p-2 md:hidden">
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;