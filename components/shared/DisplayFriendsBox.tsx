"use client";

import React, { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import AddFriendButton from "@/components/shared/AddFriendButton";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import { User } from "@/models/models";
import callApi from "@/utilities/api";
import { constructAvatarImageUrl } from "@/utilities/helpers";

interface Props {
  friends: User[];
  onUserIdsChange: (userIds: string[]) => void;
}

const DisplayFriendsBox = ({ friends, onUserIdsChange }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filteredFriendsList, setFilteredFriendsList] = useState<User[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  useEffect(() => {
    setFilteredFriendsList(friends);
  }, [friends]);

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const addUserId = (id: string) => {
    if (!userIds.includes(id)) {
      const newUserIds = [...userIds, id];
      setUserIds(newUserIds);
      onUserIdsChange(newUserIds);
    } else {
      console.log(`ID: ${id} is already in the list.`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputQuery = e.target.value;
    setQuery(inputQuery);

    if (inputQuery.length === 0) {
      setFilteredFriendsList(friends);
      setShowResults(false);
    } else {
      const minCharacters = 1;
      if (inputQuery.length >= minCharacters) {
        const filtered = friends.filter((friend) =>
          friend.username.toLowerCase().includes(inputQuery.toLowerCase())
        );
        setFilteredFriendsList(filtered);
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!currentUser) {
    return <div>Please log in to add friends.</div>;
  }

  return (
    <div ref={searchBoxRef}>
      <div className="flex flex-row">
        <input
          type="text"
          className="bg-tb-3 bg-opacity-50 text-light-1"
          placeholder=" Share with friend..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          style={{ width: "200px" }}
        />
        <button
          onClick={() => {
            setShowResults(!showResults);
          }}
        >
          <div className="mr-2 mt-2 opacity-50">
            <Image
              src="/assets/down-arrow.png"
              alt="Find a user"
              width={24}
              height={24}
              className="mb-2"
            />
          </div>
        </button>
      </div>
      <div className="parent-component" style={{ position: "relative" }}>
        {showResults && (
          <div
            className="results-container"
            style={{
              position: "absolute",
              top: 0,
              left: -36,
              zIndex: 1,
              width: "256px",
            }}
          >
            {filteredFriendsList.map((result, index) => (
              <div
                key={index}
                className="bg-tb-4 p-2 ml-9 text-light-1 no-focus outline-none resize-none flex flex-row"
              >
                <div className="flex flex-row w-full items-center cursor-pointer">
                  <div className="relative flex h-8 w-8">
                    <img
                      src={constructAvatarImageUrl(result.avatar)}
                      alt="profile image"
                      className="rounded-full object-cover shadow-2xl h-full w-full"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  {/* <div className="relative h-8 w-8">
                    <Image
                      src={result.avatar}
                      alt="profile image"
                      fill
                      className="rounded-full object-cover shadow-2xl"
                    />
                  </div> */}
                  <div className="flex items-center justify-between w-full pl-2">
                    <p>{result.username}</p>
                    <button
                      className="big-plus hover:text-gray-3"
                      onClick={() => {
                        addUserId(result.id);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayFriendsBox;
