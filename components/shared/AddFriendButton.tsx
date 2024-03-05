import callApi from "@/utilities/api";
import React, { useState } from "react";

interface Props {
  userId: string;
  friendId: string;
  isFriend: boolean;
  friendStatus: string;
  onFriendStatusChange: () => void;
}

const AddFriendButton = ({
  userId,
  friendId,
  isFriend,
  friendStatus,
  onFriendStatusChange,
}: Props) => {
  const handleButtonClick = async () => {
    if (friendStatus === "none") {
      await addFriend();
    } else if (friendStatus === "pending") {
      await cancelFriendRequest();
    } else if (isFriend) {
      await removeFriend();
    }
  };

  const addFriend = async () => {
    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/add-friend`,
        {
          method: "PUT",
          body: { userId, friendId },
        }
      );
      //console.log("UPDATED USER: ", res.user);
      //localStorage.setItem("currentUserProfile", JSON.stringify(res));
      onFriendStatusChange();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cancelFriendRequest = async () => {
    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/cancel-friend-request`,
        {
          method: "PUT",
          body: { senderId: userId, receiverId: friendId },
        }
      );
      onFriendStatusChange();
    } catch (error) {
      console.error("Error cancelling friend request:", error);
    }
  };

  const removeFriend = async () => {
    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/remove-friend`,
        {
          method: "DELETE",
          body: { userId, friendId },
        }
      );
      localStorage.setItem("currentUserProfile", JSON.stringify(res));
      onFriendStatusChange();
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  };

  return (
    <>
      {!isFriend && (
        <button onClick={handleButtonClick} className="search-friend_btn">
          {friendStatus === "none" && <p>Add Friend</p>}
          {friendStatus === "pending" && <p>Cancel Request</p>}
          {isFriend && <p>Remove Friend</p>}
        </button>
      )}
      {isFriend && (
        <button onClick={removeFriend} className="search-friend_btn">
          Remove Friend
        </button>
      )}
    </>
  );
};

export default AddFriendButton;
