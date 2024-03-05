"use client";

import React, { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import { User } from "@/models/models";
import callApi from "@/utilities/api";
import { constructAvatarImageUrl } from "@/utilities/helpers";

const SearchBox = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  const searchUsers = async (query: any) => {
    //console.log("QUERY: ", query);
    const res = await callApi(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/search`,
      {
        method: "POST",
        body: { query },
      }
    );
    setResults(res);
    if (res.length > 0) {
      setShowResults(true);
      //console.log("DATA: ", res);
    }
  };

  const debouncedSearchUsers = debounce(searchUsers, 500);

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputQuery = e.target.value;
    setQuery(inputQuery);
    if (inputQuery.length === 0) {
      setResults([]);
      setShowResults(false);
    } else {
      const minCharacters = 3;
      if (inputQuery.length >= minCharacters) {
        debouncedSearchUsers(inputQuery);
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
        <div className="mr-2 mt-2 opacity-50">
          <Image
            src="/assets/search.svg"
            alt="Find a user"
            width={24}
            height={24}
            className="mb-2"
          />
        </div>
        <input
          type="text"
          className="bg-tb-3 bg-opacity-50 text-light-1"
          placeholder=" Find a user..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          style={{ width: "200px" }}
        />
      </div>
      <div className="parent-component" style={{ position: "relative" }}>
        {showResults && (
          <div
            className="results-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
              width: "230px",
            }}
          >
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-tb-3 p-2 ml-9 bg-opacity-50 text-light-1 no-focus outline-none resize-none flex flex-row"
              >
                <div className="flex flex-row items-center gap-2 cursor-pointer">
                  <div className="relative h-8 w-8">
                    <img
                      src={constructAvatarImageUrl(result.avatar)}
                      alt="profile image"
                      className="object-cover rounded-full shadow-2xl h-full w-full"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <Link href={`/profile/${result.id}`}>{result.username}</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBox;
