import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import callApi from "@/utilities/api";
import { constructAvatarImageUrl } from "@/utilities/helpers";

interface CommentProps {
  id: string;
  createdBy: {
    username: string;
    avatar: string;
    id: string;
  };
  commentText: string;
  replies: {
    author: {
      image: string;
    };
  }[];
  createdAt: string;
  isComment?: boolean;
  onCommentDeleted: () => Promise<void>;
  albumId: string;
}

interface User {
  id: string;
  avatar: string;
  name: string;
  username: string;
}

const CommentCard = ({
  id,
  createdBy,
  commentText,
  isComment,
  albumId,
  onCommentDeleted,
}: CommentProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDelete, setStartDelete] = useState(false);

  useEffect(() => {
    const profile = getCurrentUserProfile();
    setCurrentUser(profile);
    if (profile) {
      setIsLoading(false);
    }
  }, []);

  const deleteComment = async (albumId: string) => {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/comments/${id}`);
    url.searchParams.append("albumId", albumId);
    try {
      const res = await callApi(url.toString(), {
        method: "DELETE",
      });

      if (res) {
        await onCommentDeleted();
      } else {
        console.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <article className={`flex w-full flex-col  z-10${isComment ? "" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex w-full flex-1 flex-row gap-4">
          <div className="flex flex-col items-center">
            <Link
              href={`/profile/${createdBy.id}`}
              className="relative h-11 w-11 rounded-full overflow-hidden shadow-2xl border-2 border-tb-3"
            >
              <img
                src={constructAvatarImageUrl(createdBy.avatar)}
                alt="profile image"
                className="object-cover"
                style={{ objectFit: "cover" }}
              />
            </Link>
            <div className="thread-card_bar" />
          </div>
          <div className="flex w-full flex-col">
            <Link href={`/profile/${createdBy.id}`} className="w-fit">
              <h4 className="cursor-pointer text-base-semibold text-light-1">
                {createdBy.username}
              </h4>
            </Link>
            <p className="mt-2 text-small-regular text-light-2">
              {" "}
              {commentText}{" "}
            </p>
            <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
              <div className="flex gap-3.5 flex-row">
                {currentUser && currentUser?.id === createdBy.id && (
                  <div className="flex flex-row">
                    <button onClick={() => setStartDelete(true)}>
                      <img
                        src="/assets/trash.png"
                        alt="Delete"
                        className="w-4 h-4 drop-shadow mr-2"
                      />
                    </button>
                    {startDelete && (
                      <div className="flex items-center text-gray-1 text-light-1">
                        <p className="mr-2">Are you sure?</p>
                        <button
                          onClick={() => deleteComment(albumId)}
                          className="hover:text-gray-500"
                        >
                          Yes
                        </button>
                        <p className="mx-2">/</p>
                        <button
                          onClick={() => setStartDelete(false)}
                          className="hover:text-gray-500"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CommentCard;
