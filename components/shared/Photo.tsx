import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import callApi from "@/utilities/api";
import { constructThumbImageUrl } from "@/utilities/helpers";

interface Moment {
  id: string;
  albumId: string;
  description: string;
  image: string;
  fullImage: string;
  coordinates: number[];
  commentCount: number;
  captureDate: string;
  user: {
    id: string;
    avatar: string;
    username: string;
    name: string;
  };
}

interface Album {
  id: string;
  title: string;
  moments: Moment[];
  createdById: string;
  albumType: string;
}

type PhotoProps = {
  id: string;
  src: string;
  comments: number;
  isCurrentUser: boolean | null;
  onLoad?: () => void;
  onPhotoClick: () => void;
  onEnlargeClick: () => void;
  onCommentClick: () => void;
  onMomentDeleted: (updatedAlbum: Album) => void;
  isActive: boolean;
  albumId: string;
};

const Photo: React.FC<PhotoProps> = ({
  id,
  src,
  comments,
  isCurrentUser,
  onLoad,
  onPhotoClick,
  onEnlargeClick,
  onCommentClick,
  onMomentDeleted,
  isActive,
  albumId,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const onHoverEnter = () => {
    setIsHovered(true);
  };

  const onHoverLeave = () => {
    setIsHovered(false);
  };

  async function deleteMoment() {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/moment/${id}`);
    url.searchParams.append("albumId", albumId);
    try {
      const res = await callApi(url.toString(), { method: "DELETE" });
      onMomentDeleted(res);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div
      className={`photo-container ${
        isActive
          ? "bg-tb-3 rounded-md transition-all duration-200 ease-in-out relative"
          : ""
      }`}
    >
      <div className="flex flex-col justify-center items-center p-2">
        <div
          className="relative"
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          <img
            className="photo-image md:h-auto max-md:h-20"
            src={constructThumbImageUrl(src)}
            onLoad={onLoad}
            onClick={onPhotoClick}
            alt="Photo"
          />
          {isActive && (
            <div
              className={`expand-overlay absolute inset-0 bg-black opacity-0 ${
                isHovered ? "opacity-50" : ""
              } transition-opacity duration-200 cursor-pointer`}
              onClick={onEnlargeClick}
            ></div>
          )}
          {isActive && isHovered && (
            <img
              src="/assets/expand.png"
              className="expand-icon absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={onEnlargeClick}
              alt="Expand"
            />
          )}
          {isCurrentUser && isActive && isHovered && (
            <div className="delete-icon absolute top-0 right-0 ">
              <AlertDialog>
                <AlertDialogTrigger>
                  <img
                    src="/assets/trash.png"
                    alt="Delete"
                    className="w-5 h-5 drop-shadow "
                  />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this moment from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteMoment}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div
          className="photo-text text-gray-2 text-small-semibold italic hover:text-gray-3 pt-1"
          onClick={onCommentClick}
        >
          {isActive && <p>{comments} comments</p>}
        </div>
      </div>
    </div>
  );
};

export default Photo;